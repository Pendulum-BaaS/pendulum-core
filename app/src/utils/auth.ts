import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { UserRole } from "../models/roleDefinitions";

export interface RequiredUser {
  userId: string;
  role: UserRole;
}

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
