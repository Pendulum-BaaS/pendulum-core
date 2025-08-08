import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { UserRole, USER_ROLES } from "../../models/roleDefinitions";
import { createError } from "../errorHandlingAndValidation/errorHandler";
import {
  CollectionPermissions,
  collectionsManager,
} from "../../models/collections";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

const getCollectionName = (req: Request): string => {
  const collectionName = req.query.collection || req.body.collection;
  if (!collectionName) {
    throw createError.badRequest('Collection name is required', 'MISSING_COLLECTION');
  }

  return String(collectionName);
};

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Dev mode, skip authorization, always admin
  if (process.env.NODE_ENV !== "production") {
    const devToken = jwt.sign(
      {
        userId: 'dev-user',
        role: 'admin',
      },
      process.env.JWT_SECRET as string, { expiresIn: "24h" }
    );

    req.headers.authorization = `Bearer ${devToken}`;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // optional chaining, returns undefined if authHeader is undefined

  if (!token) {
    // create token with public role if not signed in
    const publicToken = jwt.sign(
      {
        userId: "anonymous",
        role: "public",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" },
    );

    req.headers.authorization = `Bearer ${publicToken}`;

    req.user = {
      userId: "anonymous",
      role: "public",
    };
    next();
    return;
  }

  // check if token is actually the admin access key (prod only, skips in dev)
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_API_KEY &&
    token === process.env.ADMIN_API_KEY
  ) {
    // token is currently the admin key (just signed into admin dashboard)
    const adminToken = jwt.sign(
      {
        userId: "admin-user",
        role: "admin",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24H" },
    );
    req.headers.authorization = `Bearer ${adminToken}`;
    req.user = { userId: "admin-user", role: "admin" };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = {
      userId: decoded.userId,
      role: decoded.role || USER_ROLES.user, // default to user if missing
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

export const requireResourceAccess = (action: keyof CollectionPermissions) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) throw createError.internal(
      'User info not found after authentication',
      'MISSING_USER_DATA'
    );

    try {
      const collectionName = getCollectionName(req);

      // create collection if it doesn't exist MAKE SURE WE WANT THIS!!!!!!!!!!
      if (!(await collectionsManager.collectionExists(collectionName))) {
        await collectionsManager.createCollection(collectionName, user.userId);
      }

      const hasPermission = await collectionsManager.canPerformAction(
        user.userId,
        user.role,
        collectionName,
        action
      );

      if (!hasPermission) throw createError.forbidden(
        `Insufficient permissions for ${action} operation on collection ${collectionName}`,
        'INSUFFICIENT_PERMISSIONS'
      );

      next();
    } catch (error: any) {
      if (error.statusCode) throw error;
      if (error.message?.includes('does not exist')) {
        throw createError.notFound(error.message, 'COLLECTION_NOT_FOUND');
      }

      throw createError.internal('Permission check failed', 'PERMISSION_CHECK_ERROR');
    };
  };
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) throw createError.internal(
    'User info not found after authentication',
    'MISSING_USER_DATA'
  );

  if (req.user.role !== USER_ROLES.admin) throw createError.forbidden(
    'Access denied: admin privileges required',
    'INSUFFICIENT_ROLE'
  );

  next();
}

