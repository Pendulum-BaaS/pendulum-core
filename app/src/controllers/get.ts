import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { getOne, getSome, getAll } from "../models/dbmethods";

const formatSortKey = (sortFields: string): Record<string, -1 | 1> => {
  const fields = sortFields.split(",");
  const sanitizedFields = fields.map((field) => field.trim());
  const sortKey: Record<string, -1 | 1> = {};

  sanitizedFields.forEach((field) => {
    if (field.startsWith("-")) {
      sortKey[field.substring(1)] = -1;
    } else {
      sortKey[field] = 1;
    }
  });

  return sortKey;
};

export const one = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id; // validated and sanitized in middleware
  const collection = String(req.query.collection); // validated and sanitized in middleware

  try {
    const result = await getOne(collection, id);

    if (!result || result.length === 0) {
      throw createError.notFound("Document not found", "DOCUMENT_NOT_FOUND");
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const some = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const { collection, limit, offset, sortKey, ids } = req.query as {
    [key: string]: string;
  }; // collection validated and sanitized in middleware

  try {
    const parsedLimit = limit ? Number(limit) : 5;
    const parsedOffset = offset ? Number(offset) : 0;
    const parsedSortKey: Record<string, 1 | -1> = sortKey
      ? formatSortKey(sortKey)
      : { _id: -1 };

    const result = await getSome(
      collection,
      parsedLimit,
      parsedOffset,
      parsedSortKey,
      ids,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const all = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const collection = String(req.query.collection); // validated and sanitized in middleware

  try {
    const result = await getAll(collection);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
