import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { JWTPayload, UserRole } from "../types";
import prisma from "../lib/prisma";

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(): string {
    return uuidv4();
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Store refresh token in database
   */
  static async storeRefreshToken(
    userId: string,
    token: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + parseInt(config.jwt.refreshExpiresIn)
    );

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Validate refresh token
   */
  static async validateRefreshToken(token: string): Promise<string | null> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken) {
      return null;
    }

    if (new Date() > storedToken.expiresAt) {
      // Token expired, delete it
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      return null;
    }

    return storedToken.userId;
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Register a new user
   */
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    fipsasNumber?: string;
    tenantId?: string;
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        fipsasNumber: data.fipsasNumber,
        tenantId: data.tenantId,
        role: UserRole.PARTICIPANT,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId || undefined,
    });

    const refreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string) {
    // Find user with tenant info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId || undefined,
    });

    const refreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug || null,
        tenantName: user.tenant?.name || null,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string) {
    const userId = await this.validateRefreshToken(refreshToken);

    if (!userId) {
      throw new Error("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or deactivated");
    }

    // Revoke old refresh token
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId || undefined,
    });

    const newRefreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export default AuthService;
