import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { UserRole, USER_ROLES, hasPermission } from "../models/roleDefinitions";
import { createError } from "./errorHandlingAndValidation/errorHandler";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // optional chaining, returns undefined if authHeader is undefined

  if (!token) throw createError.unauthorized('Access token required', 'MISSING_TOKEN');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = {
      userId: decoded.userId,
      role: decoded.role || USER_ROLES.user, // default to user is missing
    };
    next();
  } catch(error) {
    throw createError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError.internal('User info not found after authentication', 'MISSING_USER_DATA');
    }

    if (!allowedRoles.includes(req.user.role)) throw createError.forbidden(
      `Access denied, required roles: ${allowedRoles.join(', ')}`,
      'INSUFFICIENT_ROLE'
    );

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError.internal('User info not found after authentication', 'MISSING_USER_DATA');
    }

    if (!hasPermission(req.user.role, permission)) throw createError.forbidden(
      `Insufficient permissions, required: ${permission}`,
      'INSUFFICIENT_PERMISSIONS'
    );

    next();
  };
};

export const requireResourceAccess = (action: 'read' | 'write' | 'delete') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw createError.internal('User info not found after authentication', 'MISSING_USER_DATA');
    }

    if (hasPermission(user.role, `${action}:all`)) {
      next();
      return;
    }

    if (hasPermission(user.role, `${action}:own`)) {
      next();
      return;
    }

    throw createError.forbidden(
      `Insufficient permissions for ${action} operation`,
      'INSUFFICIENT_PERMISSIONS'
    );
  };
};

export const requireManagementAccess = (resource: 'users' | 'settings') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError.internal('User info not found after authentication', 'MISSING_USER_DATA');
    }

    if (!hasPermission(req.user.role, `manage:${resource}`)) {
      throw createError.forbidden(
        `Insufficient permissions to manage ${resource}`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};
