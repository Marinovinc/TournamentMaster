import { Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest, UserRole } from "../types";

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "No token provided",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  const payload = AuthService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  req.user = payload;
  next();
};

/**
 * Role-based authorization middleware
 * Checks if user has one of the allowed roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = AuthService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

/**
 * Tenant isolation middleware
 * Ensures user can only access their own tenant's resources
 */
export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return;
  }

  // Super admins can access all tenants
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  if (!req.user.tenantId) {
    res.status(403).json({
      success: false,
      message: "No tenant associated with this user",
    });
    return;
  }

  // Check if tenantId in params matches user's tenant
  const paramTenantId = req.params.tenantId || req.body?.tenantId;
  if (paramTenantId && paramTenantId !== req.user.tenantId) {
    res.status(403).json({
      success: false,
      message: "Access denied to this tenant",
    });
    return;
  }

  next();
};
