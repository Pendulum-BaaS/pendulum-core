import { AuthenticatedRequest } from "../middleware/roleAuth";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { UserRole, hasPermission } from "../models/roleDefinitions";

export interface RequiredUser {
  userId: string;
  role: UserRole;
}

type Actions = 'read' | 'write' | 'delete';
export type Operation = 'read' | 'create' | 'update' | 'replace' | 'delete';

const permissionErrorHandler = (operation: Operation) => {
  throw createError.forbidden(
    `Access denied: insufficient permissions to ${operation} documents`,
    'INSUFFICIENT_PERMISSIONS'
  );
};

// get authed user from request
export const getAuthenticatedUser = (req: AuthenticatedRequest): RequiredUser => {
  if (!req.user) {
    throw createError.internal(
      'User info not found after authentication',
      'MISSING_USER_DATA'
    );
  }

  return req.user;
};

// type guard - does req have has authed user
export const hasAuthenticatedUser = (req: AuthenticatedRequest): req is AuthenticatedRequest & { user: RequiredUser } => {
  return req.user !== undefined;
};

export const isDocumentOwner = (userId: string, document: any): boolean => {
  return document.userId === userId;
};

export const validateDocumentAccess = (
  user: RequiredUser,
  document: any,
  operation: Operation,
  hasGlobalPermission: boolean
): void => {
  if (!hasGlobalPermission && !isDocumentOwner(user.userId, document)) {
    permissionErrorHandler(operation);
  }
};

// permission checker/error thrower helper function
const requirePermissions = (
  user: RequiredUser,
  permissionType: Actions,
  operation: Operation
): void => {
  if (hasPermission(user.role, `${permissionType}:all`)) return;
  if (hasPermission(user.role, `${permissionType}:own`)) return;

  permissionErrorHandler(operation);
};

const requireReadPermission = (user: RequiredUser): void => {
  requirePermissions(user, 'read', 'read');
};

const requireUpdatePermission = (user: RequiredUser): void => {
  requirePermissions(user, 'write', 'update');
};

const requireReplacePermission = (user: RequiredUser): void => {
  requirePermissions(user, 'write', 'replace');
};

const requireDeletePermission = (user: RequiredUser): void => {
  requirePermissions(user, 'delete', 'delete');
};

// create is different, only needs write: own or write: all
const requireCreatePermission = (user: RequiredUser): void => {
  if (!hasPermission(user.role, 'write:all') && !hasPermission(user.role, 'write:own')) {
    permissionErrorHandler('create');
  }
};

export const permissionChecker = { // replace this with individual exports?
  read: requireReadPermission,
  update: requireUpdatePermission, // delete this one?
  replace: requireReplacePermission, // delete this one?
  create: requireCreatePermission,
  delete: requireDeletePermission, // delete this one?
} as const;
