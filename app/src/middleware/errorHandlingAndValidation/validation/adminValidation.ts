import { Request, Response, NextFunction } from "express";
import { createError } from "../errorHandler";

export const validateAdminKeyRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const adminKey = req.body.adminKey?.trim();

  if (!adminKey || adminKey.length === 0) {
    throw createError.badRequest('Admin key is required', 'MISSING_ADMIN_KEY');
  }

  if (typeof adminKey !== 'string') {
    throw createError.badRequest('Admin key must be a string', 'INVALID_ADMIN_KEY_FORMAT');
  }

  next();
};
