import { Request, Response, NextFunction } from "express";
import { replace, getOne } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { AuthenticatedRequest } from "../middleware/roleAuth";
import { hasPermission } from "../models/roleDefinitions";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { getAuthenticatedUser, validateDocumentAccess } from "../utils/auth";

export const replaceController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = String(req.params.id);
  const { collection, newItem } = req.body;

  try {
    const user = getAuthenticatedUser(req);

    const existingDoc = await getOne(collection, id);
    if (!existingDoc || existingDoc.length === 0) {
      throw createError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
    }

    const document = existingDoc[0];
    const hasGlobalWrite = hasPermission(user.role, 'write:all');
    validateDocumentAccess(user, document, 'replace', hasGlobalWrite);

    const formattedNewItem = {
      ...newItem,
      userId: document.userId,
      createdAt: document.createdAt,
      createdBy: document.createdBy,
      updatedAt: new Date(),
      updatedBy: user.userId,
    };

    const result = await replace(collection, id, formattedNewItem);
    if (!result) throw createError.notFound(
      'Document not found or could not be replaced',
      'REPLACE_FAILED'
    );

    const filter = { _id: id };
    eventClient.emitUpdate(collection, filter, [result], { $set: formattedNewItem });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
