import { Request, Response, NextFunction } from "express";
import { getOne, updateOne, updateSome, updateAll } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { getAuthenticatedUser } from "../utils/auth";

export const one = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const { collection, updateOperation } = req.body;

  try {
    const user = getAuthenticatedUser(req);

    const existingDoc = await getOne(collection, id);
    if (!existingDoc || existingDoc.length === 0) {
      throw createError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
    }

    const formattedOperation = {
      ...updateOperation,
      $set: {
        ...updateOperation.$set,
        updatedAt: new Date(),
        updatedBy: user.userId,
      },
    };

    const result = await updateOne(collection, id, formattedOperation);
    if (!result) throw createError.notFound(
      'Document not found or could not be updated',
      'UPDATE_FAILED'
    );

    eventClient.emitUpdate(collection, { _id: id }, [result], formattedOperation);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const some = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { collection, filter, updateOperation } = req.body;

  try {
    const user = getAuthenticatedUser(req);

    const formattedOperation = {
      ...updateOperation,
      $set: {
        ...updateOperation.$set,
        updatedAt: new Date(),
        updatedBy: user.userId,
      },
    };

    const result = await updateSome(collection, filter, formattedOperation);
    eventClient.emitUpdate(collection, filter, result, formattedOperation);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const all = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { collection, updateOperation } = req.body;

  try {
    const user = getAuthenticatedUser(req);

    const formattedOperation = {
      ...updateOperation,
      $set: {
        ...updateOperation.$set,
        updatedAt: new Date(),
        updatedBy: user.userId,
      },
    };

    const filter = {};
    const result = await updateAll(collection, formattedOperation);
    eventClient.emitUpdate(collection, filter, result, formattedOperation);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
