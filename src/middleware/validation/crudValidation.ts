import { Request, Response, NextFunction } from "express";
import { createError } from "../errorHandler";

const COLLECTION_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/; // starts with a letter, followed by alphanumeric underscores and hyphens
const COLLECTION_NAME_MAX = 30;
const MONGODB_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const MAX_LIMIT = 1000;
const MAX_OFFSET = 100000;

const isValidCollectionName = (collection: string): boolean => {
  return (
    typeof collection === 'string' &&
    collection.length > 0 &&
    collection.length <= COLLECTION_NAME_MAX &&
    COLLECTION_NAME_REGEX.test(collection)
  );
};

const isValidMongoId = (id: string): boolean => {
  return typeof id === 'string' && MONGODB_ID_REGEX.test(id);
};

// const isValidInteger = (value: any, min: number = 0, max?: number): boolean => {
//   const num = Number(value);
//   return !isNaN(num) && Number.isInteger(num) && num >= min && (!max || num <= max);
// };

// const isNonEmptyString = (value: any): boolean => {
//   return typeof value === 'string' && value.trim().length > 0;
// };

const isNonEmptyObject = (obj: any): boolean => {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
};

const isNonEmptyArray = (arr: any): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};

const missingCollectionNameHandler = () => {
  throw createError.badRequest('Collection name is required', 'MISSING_COLLECTION');
};

const invalidCollectionNameHandler = () => {
  throw createError.badRequest(
    `Collection name must be (1-${COLLECTION_NAME_MAX} chars, start with a letter, \
    alphanumeric with underscores/hyphens`,
    'INVALID_COLLECTION_NAME'
  );
};

const missingIdHandler = () => {
  throw createError.badRequest('ID is required', 'MISSING_ID');
};

const missingUpdateOperationHandler = () => {
  throw createError.badRequest(
    'Update operation is required',
    'MISSING_UPDATE_OPERATION'
  );
};

const invalidIdFormatHandler = () => {
  throw createError.badRequest(
    'Invalid ID format, must be a valid MongoDB ObjectId',
    'INVALID_ID_FORMAT'
  );
};

const invalidUpdateFormatHandler = () => {
  throw createError.badRequest(
    'Update operation must be a non-empty object',
    'INVALID_UPDATE_OPERATION'
  );
};

// GET validation
export const validateGetOne = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;
  const { collection } = req.query;

  if (!id) missingIdHandler();
  if (!collection) missingCollectionNameHandler();

  const sanitizedId = String(id).trim();
  const sanitizedCollection = String(collection).trim();

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  req.params.id = sanitizedId;
  req.query.collection = sanitizedCollection;
  next();
};

export const validateGetSome = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, limit, offset, sortKey } = req.query;

  if (!collection) missingCollectionNameHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  //   // Validate limit (optional, defaults to 5 in controller)
  // let sanitizedLimit = 5;
  // if (limit !== undefined) {
  //   if (!isValidInteger(limit, 1, MAX_LIMIT)) throw createError.badRequest(
  //     `Limit must be an integer between 1 and ${MAX_LIMIT}`,
  //     'INVALID_LIMIT'
  //   );
  //   sanitizedLimit = Number(limit);
  // }

  // // Validate offset (optional, defaults to 0 in controller)
  // let sanitizedOffset = 0;
  // if (offset !== undefined) {
  //   if (!isValidInteger(offset, 0, MAX_OFFSET)) throw createError.badRequest(
  //     `Offset must be an integer between 0 and ${MAX_OFFSET}`,
  //     'INVALID_OFFSET'
  //   );
  //   sanitizedOffset = Number(offset);
  // }

  // // Validate sortKey (optional, has default in controller)
  // if (sortKey !== undefined && !isNonEmptyString(sortKey)) throw createError.badRequest(
  //   'Sort key must be a non-empty string',
  //   'INVALID_SORT_KEY'
  // );

  req.query.collection = sanitizedCollection;
  // if (limit !== undefined) req.query.limit = String(sanitizedLimit);
  // if (offset !== undefined) req.query.offset = String(sanitizedOffset);
  // if (sortKey !== undefined) req.query.sortKey = String(sortKey).trim();
  next();
};

export const validateGetAll = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection } = req.query;

  if (!collection) missingCollectionNameHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  req.query.collection = sanitizedCollection;
  next();
};

// POST validation
export const validateInsert = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, newItems } = req.body;

  if (!collection) missingCollectionNameHandler();
  if (!newItems) throw createError.badRequest(
    'New items are required',
    'MISSING_NEW_ITEMS'
  );

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  if (!Array.isArray(newItems) && !isNonEmptyObject(newItems)) {
    throw createError.badRequest(
      'New items must be a non-empty object or array of objects',
      'INVALID_NEW_ITEMS'
    );
  };

  if (Array.isArray(newItems)) {
    if (!isNonEmptyArray(newItems)) throw createError.badRequest(
      'New items array cannot be empty',
      'EMPTY_NEW_ITEMS_ARRAY'
    );

    newItems.forEach((item, index) => {
      if (!isNonEmptyObject(item)) throw createError.badRequest(
        `Item at index ${index} must be a non-empty object`,
        'INVALID_ITEM_IN_ARRAY'
      );
    });
  };

  req.body.collection = sanitizedCollection;
  next();
};

// PATCH validation
export const validateUpdateOne = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;
  const { collection, updateOperation } = req.body;

  if (!id) missingIdHandler();
  if (!collection) missingCollectionNameHandler();
  if (!updateOperation) missingUpdateOperationHandler();

  const sanitizedId = String(id).trim();
  const sanitizedCollection = String(collection).trim();

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();
  if (!isNonEmptyObject(updateOperation)) invalidUpdateFormatHandler();

  req.params.id = sanitizedId;
  req.body.collection = sanitizedCollection;
  next();
};

export const validateUpdateSome = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, filter, updateOperation } = req.body;

  if (!collection) missingCollectionNameHandler();
  if (!filter) throw createError.badRequest(
    'Filter is required',
    'MISSING_FILTER'
  );
  if (!updateOperation) missingUpdateOperationHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();
  if (!isNonEmptyObject(filter)) throw createError.badRequest(
    'Filter must be a non-empty object',
    'INVALID_FILTER'
  );
  if (!isNonEmptyObject(updateOperation)) invalidUpdateFormatHandler();

  req.body.collection = sanitizedCollection;
  next();
};

export const validateUpdateAll = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, updateOperation } = req.body;

  if (!collection) missingCollectionNameHandler();
  if (!updateOperation) missingUpdateOperationHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();
  if (!isNonEmptyObject(updateOperation)) invalidUpdateFormatHandler();

  req.body.collection = sanitizedCollection;
  next();
};

// PUT validation
export const validateReplace = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;
  const { collection, newItem } = req.body;

  if (!id) missingIdHandler();
  if (!collection) missingCollectionNameHandler();
  if (!newItem) throw createError.badRequest(
    'New item is required',
    'MISSING_NEW_ITEM'
  );

  const sanitizedId = String(id).trim();
  const sanitizedCollection = String(collection).trim();

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();
  if (!isNonEmptyObject(newItem)) throw createError.badRequest(
    'New item must be a non-empty object',
    'INVALID_NEW_ITEM'
  );

  req.params.id = sanitizedId;
  req.body.collection = sanitizedCollection;
  next();
};

// DELETE validation
export const validateDeleteOne = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;
  const { collection } = req.query;

  if (!id) missingIdHandler();
  if (!collection) missingCollectionNameHandler();

  const sanitizedId = String(id).trim();
  const sanitizedCollection = String(collection).trim();

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  req.params.id = sanitizedId;
  req.query.collection = sanitizedCollection;
  next();
};

export const validateDeleteSome = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, ...filterParams } = req.query;

  if (!collection) missingCollectionNameHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  // check for filter parameters besides collection for safety
  if (Object.keys(filterParams).length === 0) throw createError.badRequest(
    'Filter parameters are required for deleting some items',
    'MISSING_FILTER_PARAMS'
  );

  req.query.collection = sanitizedCollection;
  next();
};

export const validateDeleteAll = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { collection, confirm } = req.query;

  if (!collection) missingCollectionNameHandler();

  const sanitizedCollection = String(collection).trim();

  if (!isValidCollectionName(sanitizedCollection)) invalidCollectionNameHandler();

  // require confirmation for safety
  if (confirm !== 'true') throw createError.badRequest(
    'Delete all operation requires confirmation, add "confirm=true" to query parameters',
    'DELETE_ALL_CONFIRMATION_REQUIRED'
  );

  req.query.collection = sanitizedCollection;
  next();
};
