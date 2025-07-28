import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { hasPermission } from '../models/roleDefinitions';
import { createError } from '../middleware/errorHandlingAndValidation/errorHandler';
import { getAuthenticatedUser, validateDocumentAccess, permissionChecker } from "../utils/auth";
import {
  getOne,
  getSome,
  getAll,
  getSomeWithOwnership,
  getAllWithOwnership
} from '../models/dbmethods';

const formatSortKey = (sortFields: string): Record<string, -1 | 1> => {
  const fields = sortFields.split(',');
  const sanitizedFields = fields.map(field => field.trim());
  const sortKey: Record<string, -1 | 1> = {};

  sanitizedFields.forEach(field => {
    if (field.startsWith('-')) {
      sortKey[field.substring(1)] = -1;
    } else {
      sortKey[field] = 1;
    }
  });

  return sortKey;
};

export const one = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const id = req.params.id; // validated and sanitized in middleware
  const collection = String(req.query.collection); // validated and sanitized in middleware

  try {
    const user = getAuthenticatedUser(req); // verify user logged in
    const result = await getOne(collection, id);

    if (!result || result.length === 0) {
      throw createError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
    }

    const document = result[0];
    const hasGlobalRead = hasPermission(user.role, 'read:all');
    validateDocumentAccess(user, document, 'read', hasGlobalRead); // check user permission

    res.json(result);
  } catch(error) {
    next(error);
  }
};

export const some = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { collection, limit, offset, sortKey } = req.query as { [key: string]: string }; // collection validated and sanitized in middleware

  try {
    const user = getAuthenticatedUser(req);
    const parsedLimit = limit ? Number(limit) : 5;
    const parsedOffset = offset ? Number(offset) : 0;
    const parsedSortKey: Record<string, 1 | -1> = sortKey ? formatSortKey(sortKey) : { _id: -1 };

    let result;

    if (hasPermission(user.role, 'read:all')) {
      result = await getSome(collection, parsedLimit, parsedOffset, parsedSortKey);
    } else if (hasPermission(user.role, 'read:own')) {
      result = await getSomeWithOwnership(collection, user.userId, parsedLimit, parsedOffset, parsedSortKey);
    } else {
      permissionChecker.read(user);
    }

    res.json(result);
  } catch(error) {
    next(error);
  }
};

export const all = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const collection = String(req.query.collection); // validated and sanitized in middleware
  
  try {
    const user = getAuthenticatedUser(req);

    let result;

    if (hasPermission(user.role, 'read:all')) {
      result = await getAll(collection);
    } else if (hasPermission(user.role, 'read:own')) {
      result = await getAllWithOwnership(collection, user.userId);
    } else {
      permissionChecker.read(user);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};
