import { Request, Response, NextFunction } from "express";
import { createError } from "../errorHandler";
import { UserRole, USER_ROLES } from "../../../models/roleDefinitions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/; // alphanumeric, underscores, hyphens
const PASSWORD_MIN = 3;
// const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/; // At least one lowercase, uppercase, and number

const isValidEmail = (email: string): boolean => {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
};

const isValidPassword = (password: string): boolean => {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN
    // && PASSWORD_REGEX.test(password)
  );
}

const isValidUsername = (username: string): boolean => {
  const sanitizedUsername = username.trim();
  return (
    sanitizedUsername.length >= USERNAME_MIN &&
    sanitizedUsername.length <= USERNAME_MAX &&
    USERNAME_REGEX.test(sanitizedUsername)
  );
}

const isNonEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, username } = req.body;

  if (!email) throw createError.badRequest('Email is required', 'MISSING_EMAIL');
  if (!password) throw createError.badRequest('Password is required', 'MISSING_PASSWORD');
  if (!username) throw createError.badRequest('Username is required', 'MISSING_USERNAME');

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedUsername = username.trim();

  if (!isValidEmail(sanitizedEmail)) throw createError.badRequest(
    'Invalid email format',
    'INVALID_EMAIL'
  );

  if (!isValidPassword(password)) throw createError.badRequest(
    `Password must be at least ${PASSWORD_MIN} characters`, // and contain at least one lowercase letter, one uppercase letter, and one number
    'INVALID_PASSWORD'
  );

  if (!isValidUsername(sanitizedUsername)) throw createError.badRequest(
    `Username must be a string between ${USERNAME_MIN} and ${USERNAME_MAX} characters, \
    and can only contain letters, numbers, underscores, and hyphens`,
    'INVALID_USERNAME'
  );

  req.body.email = sanitizedEmail;
  req.body.username = sanitizedUsername;
  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { identifier, password } = req.body;

  if (!identifier) throw createError.badRequest(
    'Email or username is required',
    'MISSING_IDENTIFIER'
  );

  if (!password) throw createError.badRequest('Password is required', 'MISSING_PASSWORD');
  
  const sanitizedIdentifier = identifier.trim().toLowerCase();
  const isEmail = sanitizedIdentifier.includes('@');
  if (isEmail) {
    if (!isValidEmail(sanitizedIdentifier)) throw createError.badRequest(
      'Invalid email format',
      'INVALID_EMAIL'
    );
  } else {
    if (!isValidUsername(sanitizedIdentifier)) throw createError.badRequest(
      `Username must be a string between ${USERNAME_MIN} and ${USERNAME_MAX} characters \
      and can only contain letters, numbers, underscores, and hyphens`,
      'INVALID_USERNAME'
    );
  }

  if (!isNonEmptyString(password)) throw createError.badRequest(
    'Password cannot be empty',
    'INVALID_PASSWORD'
  );

  req.body.identifier = sanitizedIdentifier;
  req.body.isEmailLogin = isEmail;
  next();
}

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) throw createError.unauthorized(
    'Authorization header is required',
    'MISSING_AUTH_HEADER'
  );

  if (!authHeader.startsWith('Bearer ')) throw createError.unauthorized(
    'Authorization header must start with "Bearer "',
    'INVALID_AUTH_FORMAT'
  );

  const token = authHeader.substring(7).trim(); // remove 'Bearer ' and trim

  if (!token || token.length === 0) throw createError.unauthorized(
    'Token is required',
    'MISSING_TOKEN'
  );

  (req as any).token = token;
  next();
}

export const validatePasswordReset = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const email = req.body.email;

  if (!email) throw createError.badRequest('Email is required', 'MISSING_EMAIL');

  const sanitizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(sanitizedEmail)) throw createError.badRequest(
    'Invalid email format',
    'INVALID_EMAIL'
  );

  req.body.email = sanitizedEmail;
  next();
};

export const validatePasswordChange = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) throw createError.badRequest(
    'Current password is required',
    'MISSING_CURRENT_PASSWORD'
  );

  if (!newPassword) throw createError.badRequest(
    'New password is required',
    'MISSING_NEW_PASSWORD'
  );

  if (!isNonEmptyString(currentPassword)) throw createError.badRequest(
    'Current password must be a valid non-empty string',
    'INVALID_CURRENT_PASSWORD'
  );

  if (!isValidPassword(newPassword)) throw createError.badRequest(
    `New password must be at least ${PASSWORD_MIN} characters`, // and contain at least one lowercase letter, one uppercase letter, and one number
    'INVALID_PASSWORD'
  );

  if (currentPassword === newPassword) throw createError.badRequest(
    'New password must be different from current password',
    'SAME_PASSWORD'
  );

  next();
}

export const validateRoleUpdate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const role = req.body.role;
  const userId = req.params.userId;

  if (!userId) throw createError.badRequest('User ID is required', 'MISSING_USER_ID');
  if (!role) throw createError.badRequest('Role is required', 'MISSING_ROLE');

  if (!Object.values(USER_ROLES).includes(role)) {
    throw createError.badRequest(
      'Invalid role: must be admin, editor, or user',
      'INVALID_ROLE'
    );
  }

  const MONGODB_ID_REGEX = /^[0-9a-fA-F]{24}$/;
  if (!MONGODB_ID_REGEX.test(userId)) {
    throw createError.badRequest(
      'Invalid user ID format',
      'INVALID_USER_ID_FORMAT'
    );
  }

  next();
};
