import { Request, Response, NextFunction } from "express";
import { removeOne, removeSome, removeAll, getOne } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { hasPermission } from "../models/roleDefinitions";
import { getAuthenticatedUser, validateDocumentAccess } from "../utils/auth";


export const one = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const collection = String(req.query.collection);

  try {
    const user = getAuthenticatedUser(req);
    const existingDoc = await getOne(collection, id);
    if (!existingDoc || existingDoc.length === 0) {
      throw createError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
    }

    const doc = existingDoc[0];
    const hasGlobalDelete = hasPermission(user.role, 'delete:all');
    validateDocumentAccess(user, doc, 'delete', hasGlobalDelete); // check permissions for this doc

    const result = await removeOne(collection, id);
    if (!result) throw createError.notFound(
      'Document not found or could not be deleted',
      'DELETE_FAILED'
    );

    eventClient.emitDelete(collection, { _id: id }, [result]);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const formatFilter = (query: Record<string, any>) => {
  const filter: Record<string, any> = {};

  Object.keys(query).forEach((key) => {
    if (key.includes("[") && key.includes("]")) {
      // Handle operators like price[gte]=100
      const [field, operator] = key.split("[");
      const op = operator.replace("]", "");

      if (!filter[field]) filter[field] = {};

      let value = query[key];

      // Handle different operators
      switch (op) {
        case "gte":
        case "gt":
        case "lte":
        case "lt":
          filter[field][`$${op}`] = Number(value);
          break;
        case "in":
        case "nin":
          filter[field][`$${op}`] = value.split(",");
          break;
        case "regex":
          filter[field].$regex = value;
          filter[field].$options = "i"; // case insensitive
          break;
      }
    } else {
      // Direct field match
      if (query[key] === "true") {
        filter[key] = true;
      } else if (query[key] === "false") {
        filter[key] = false;
      } else {
        filter[key] = query[key];
      }
    }
  });

  return filter;
};

export const some = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { collection, ...filterParams } = req.query;
  const sanitizedCollection = collection as string;

  try {
    const user = getAuthenticatedUser(req);

    if (!hasPermission(user.role, 'delete:all')) {
      throw createError.forbidden(
        'Access denied: insufficient permissions to delete multiple documents',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    const formattedFilter = formatFilter(filterParams);
    const result = await removeSome(sanitizedCollection, formattedFilter);
    eventClient.emitDelete(sanitizedCollection, formattedFilter, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const all = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const collection = String(req.query.collection);

  try {
    const user = getAuthenticatedUser(req);

    if (!hasPermission(user.role, 'delete:all')) {
      throw createError.forbidden(
        'Access denied: insufficient permissions to delete all documents',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    const filter = {};
    const result = await removeAll(collection);
    eventClient.emitDelete(collection, filter, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
