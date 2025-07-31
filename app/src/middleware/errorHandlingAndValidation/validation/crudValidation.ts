import { Request, Response, NextFunction } from "express";
import { createError } from "../errorHandler";

const COLLECTION_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]*$/; // starts with a letter, followed by alphanumeric underscores and hyphens
const COLLECTION_NAME_MAX = 30;
const MONGODB_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const MAX_LIMIT = 1000;
const MAX_OFFSET = 1000;

const isValidCollectionName = (collection: string): boolean => {
  return (
    typeof collection === "string" &&
    collection.length > 0 &&
    collection.length <= COLLECTION_NAME_MAX &&
    COLLECTION_NAME_REGEX.test(collection)
  );
};

const isValidMongoId = (id: string): boolean => {
  return typeof id === "string" && MONGODB_ID_REGEX.test(id);
};

const isValidLimit = (value: any): boolean => {
  const min = 1;
  const num = Number(value);
  return Number.isInteger(num) && num <= MAX_LIMIT && num >= min;
};

const isValidOffset = (value: any): boolean => {
  const min = 1;
  const num = Number(value);
  return Number.isInteger(num) && num <= MAX_OFFSET && num >= min;
};

const isNonEmptyString = (value: any): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

const isNonEmptyObject = (obj: any): boolean => {
  return (
    obj &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0
  );
};

const missingCollectionNameHandler = () => {
  throw createError.badRequest(
    "Collection name is required",
    "MISSING_COLLECTION",
  );
};

const invalidCollectionNameHandler = () => {
  throw createError.badRequest(
    `Collection name must be (1-${COLLECTION_NAME_MAX} chars, start with a letter, \
    alphanumeric with underscores/hyphens`,
    "INVALID_COLLECTION_NAME",
  );
};

const missingIdHandler = () => {
  throw createError.badRequest("ID is required", "MISSING_ID");
};

const missingUpdateOperationHandler = () => {
  throw createError.badRequest(
    "Update operation is required",
    "MISSING_UPDATE_OPERATION",
  );
};

const invalidIdFormatHandler = () => {
  throw createError.badRequest(
    "Invalid ID format, must be a valid MongoDB ObjectId",
    "INVALID_ID_FORMAT",
  );
};

const invalidUpdateFormatHandler = () => {
  throw createError.badRequest(
    "Update operation must be a non-empty object",
    "INVALID_UPDATE_OPERATION",
  );
};

const getAndValidateCollection = (req: Request): string => {
  const collection = req.query.collection || req.body.collection;
  if (!collection) missingCollectionNameHandler();

  const sanitizedCollection = String(collection).trim();
  if (!isValidCollectionName(sanitizedCollection))
    invalidCollectionNameHandler();

  return sanitizedCollection;
};

// GET validation
export const validateGetOne = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;

  if (!id) missingIdHandler();
  const sanitizedId = String(id).trim();
  const sanitizedCollection = getAndValidateCollection(req);
  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();

  req.params.id = sanitizedId;
  req.query.collection = sanitizedCollection;
  next();
};

export const validateGetSome = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const defaultLimit = 5;
  const defaultOffset = 0;

  const { limit, offset, sortKey } = req.query;
  const sanitizedCollection = getAndValidateCollection(req);

  if (limit !== undefined && !isValidLimit(limit)) {
    throw createError.badRequest(
      `Limit must be an integer between 1 and ${MAX_LIMIT}`,
      "INVALID_LIMIT",
    );
  }

  if (offset !== undefined && !isValidOffset(offset)) {
    throw createError.badRequest(
      `Offset must be an integer between 0 and ${MAX_OFFSET}`,
      "INVALID_OFFSET",
    );
  }
  if (sortKey !== undefined && !isNonEmptyString(sortKey))
    throw createError.badRequest(
      "Sort key must be a non-empty string",
      "INVALID_SORT_KEY",
    );

  const sanitizedLimit = isValidLimit(limit) ? Number(limit) : defaultLimit;
  const sanitizedOffset = isValidOffset(offset)
    ? Number(offset)
    : defaultOffset;

  // update req object with sanitized and validated properties
  req.query.collection = sanitizedCollection;
  if (limit !== undefined) req.query.limit = String(sanitizedLimit);
  if (offset !== undefined) req.query.offset = String(sanitizedOffset);
  if (sortKey !== undefined) req.query.sortKey = String(sortKey).trim();
  next();
};

export const validateGetAll = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const sanitizedCollection = getAndValidateCollection(req);

  req.query.collection = sanitizedCollection;
  next();
};

// POST validation
export const validateInsert = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { newItems } = req.body;
  if (!newItems)
    throw createError.badRequest("New items are required", "MISSING_NEW_ITEMS");

  const sanitizedCollection = getAndValidateCollection(req);

  if (!Array.isArray(newItems)) {
    throw createError.badRequest(
      "newItems must be an array",
      "INVALID_NEW_ITEMS",
    );
  } else if (newItems.length === 0) {
    throw createError.badRequest(
      "newItems array cannot be empty",
      "EMPTY_NEW_ITEMS_ARRAY",
    );
  }

  newItems.forEach((item, index) => {
    if (!isNonEmptyObject(item)) {
      throw createError.badRequest(
        `Item at index ${index} must be a non-empty object`,
        "INVALID_ITEM_IN_ARRAY",
      );
    }
  });

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
  const { updateOperation } = req.body;

  if (!id) missingIdHandler();
  if (!updateOperation) missingUpdateOperationHandler();

  const sanitizedId = String(id).trim();
  const sanitizedCollection = getAndValidateCollection(req);

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
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
  const { filter, updateOperation } = req.body;
  if (!filter)
    throw createError.badRequest("Filter is required", "MISSING_FILTER");
  if (!updateOperation) missingUpdateOperationHandler();
  const sanitizedCollection = getAndValidateCollection(req);

  if (!isNonEmptyObject(filter))
    throw createError.badRequest(
      "Filter must be a non-empty object",
      "INVALID_FILTER",
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
  const { updateOperation } = req.body;
  if (!updateOperation) missingUpdateOperationHandler();

  const sanitizedCollection = getAndValidateCollection(req);
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
  const { newItem } = req.body;

  if (!id) missingIdHandler();
  if (!newItem)
    throw createError.badRequest("New item is required", "MISSING_NEW_ITEM");

  const sanitizedId = String(id).trim();
  const sanitizedCollection = getAndValidateCollection(req);

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();
  if (!isNonEmptyObject(newItem))
    throw createError.badRequest(
      "New item must be a non-empty object",
      "INVALID_NEW_ITEM",
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

  if (!id) missingIdHandler();
  const sanitizedId = String(id).trim();
  const sanitizedCollection = getAndValidateCollection(req);

  if (!isValidMongoId(sanitizedId)) invalidIdFormatHandler();

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

  const sanitizedCollection = getAndValidateCollection(req);

  // check for filter parameters besides collection for safety
  if (Object.keys(filterParams).length === 0)
    throw createError.badRequest(
      "Filter parameters are required for deleting some items",
      "MISSING_FILTER_PARAMS",
    );

  req.query.collection = sanitizedCollection;
  next();
};

export const validateDeleteAll = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const sanitizedCollection = getAndValidateCollection(req);

  req.query.collection = sanitizedCollection;
  next();
};
