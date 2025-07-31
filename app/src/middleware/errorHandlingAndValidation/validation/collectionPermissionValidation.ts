import { Request, Response, NextFunction } from "express";
import { createError } from "../errorHandler";
import { USER_ROLES } from "../../../models/roleDefinitions";

const COLLECTION_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const COLLECTION_NAME_MAX_LENGTH = 30;

const isValidCollectionName = (collectionName: string): boolean => {
  return (
    typeof collectionName === 'string' &&
    collectionName.length >= 1 &&
    collectionName.length <= COLLECTION_NAME_MAX_LENGTH &&
    COLLECTION_NAME_REGEX.test(collectionName)
  );
}

const isValidRole = (role: string): boolean => {
  return Object.values(USER_ROLES).includes(role as any);
}

const isValidPermissionsObject = (permissions: any): boolean => {
  if (!permissions || typeof permissions !== 'object') return false;

  const validActions = ['create', 'read', 'update', 'delete'];

  for (const action of validActions) {
    if (!Array.isArray(permissions[action])) return false; // check if each permissions CRUD action points to an array

    for (const role of permissions[action]) {
      if (!isValidRole(role)) return false; // check if the array contains only peoper roles
    }
  }

  return true;
};

export const validateGetPermission = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const collectionName = req.params.collectionName;
  if (!collectionName) throw createError.badRequest(
    'Collection name is required',
    'MISSING_COLLECTION'
  );

  const sanitizedCollectionName = collectionName.trim();
  if (!isValidCollectionName(sanitizedCollectionName)) {
    throw createError.badRequest(
      'Invalid collection name format',
      'INVALID_COLLECTION_NAME'
    );
  }

  req.params.collectionName = sanitizedCollectionName;
  next();
};

export const validateUpdatePermissions = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const collectionName = req.params.collectionName;
  const newPermissions = req.body.newPermissions;

  if (!collectionName) {
    throw createError.badRequest('collectionName field is required', 'MISSING_COLLECTION');
  }
  if (!newPermissions) {
    throw createError.badRequest('newPermissions field is required', 'MISSING_NEW_PERMISSIONS');
  }

  const sanitizedCollectionName = collectionName.trim();
  if (!isValidCollectionName(sanitizedCollectionName)) {
    throw createError.badRequest('Invalid collection name format', 'INVALID_COLLECTION_NAME');
  }

  if (!isValidPermissionsObject(newPermissions)) {
    throw createError.badRequest(
      'Invalid permissions object. Must include CRUD arrays with valid roles',
      'INVALID_PERMISSIONS_OBJECT'
    );
  }

  req.params.collectionName = sanitizedCollectionName;
  next();
};
