import { Request, Response, NextFunction } from "express";
import { insert } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { getAuthenticatedUser, permissionChecker } from "../utils/auth";

export const insertController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const { collection, newItems } = req.body;

  try {
    const user = getAuthenticatedUser(req);
    permissionChecker.create(user);

    const itemsToInsert = Array.isArray(newItems) ? newItems : [newItems];
    const formattedItems = itemsToInsert.map(item => ({
      ...item,
      userId: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.userId,
    }));

    const result = await insert(collection, formattedItems);
    eventClient.emitInsert(collection, result);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
