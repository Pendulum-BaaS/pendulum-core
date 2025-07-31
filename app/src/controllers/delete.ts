import { Request, Response, NextFunction } from "express";
import { removeOne, removeSome, removeAll, getOne } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { getAuthenticatedUser } from "../utils/auth";

export const one = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.params.id;
  const collection = String(req.query.collection);

  try {
    const existingDoc = await getOne(collection, id);
    if (!existingDoc || existingDoc.length === 0) {
      throw createError.notFound("Document not found", "DOCUMENT_NOT_FOUND");
    }

    const result = await removeOne(collection, id);
    if (!result)
      throw createError.notFound(
        "Document not found or could not be deleted",
        "DELETE_FAILED",
      );

    eventClient.emitDelete(collection, { _id: id }, [result]);
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
  const collection = String(req.query.collection);
  const ids = String(req.query.ids);
  const parsedIds = ids.split(",").map((id) => id.trim());

  try {
    const result = await removeSome(collection, ids);
    eventClient.emitDelete(
      collection,
      {
        _id: { $in: parsedIds },
      },
      result,
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
  const collection = String(req.query.collection);

  try {
    const filter = {};
    const result = await removeAll(collection);
    eventClient.emitDelete(collection, filter, result);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
