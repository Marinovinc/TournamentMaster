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
/**
 * Helper: Check if user is Admin or President
 * Both roles have same permissions for tenant management
 */
export const isAdminOrPresident = (...additionalRoles: UserRole[]) => {
  const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];
  return authorize(...adminRoles, ...additionalRoles);
};

/**
 * Helper: Check if user can manage teams (admin, president, or team captain)
 */
export const canManageTeam = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }

  const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];

  // Admin/President can always manage
  if (adminRoles.includes(req.user.role)) {
    next();
    return;
  }

  // Others need to be team captain (checked in service layer)
  next();
};

/**
 * Helper: Get tenant ID from authenticated request
 * Returns tenantId for tenant-scoped operations
 */
export const getTenantId = (req: AuthenticatedRequest): string | null => {
  if (!req.user) return null;

  // Super admin can specify tenantId in query/params
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return (req.query.tenantId as string) ||
           (req.params.tenantId as string) ||
           req.user.tenantId ||
           null;
  }

  return req.user.tenantId || null;
};

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
