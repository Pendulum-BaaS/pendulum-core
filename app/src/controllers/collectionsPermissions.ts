import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/rbac/roleAuth";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";
import { CollectionsManager, collectionsManager } from "../models/collections";

export const getCollectionPermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const collectionName = req.params.collectionName;

    const permissions = await collectionsManager.getCollectionPermissions(collectionName);

    res.json({
      success: true,
      data: {
        collectionName,
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollectionPermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const collectionName = req.params.collectionName;
    const newPermissions = req.body.newPermissions;

    const success = await collectionsManager.updateCollectionPermissions(
      collectionName,
      newPermissions
    )

    if (!success) throw createError.internal(
      'Failed to update collection permissions',
      'PERMISSION_UPDATE_FAILED'
    );

    res.json({
      success: true,
      message: `Permissions updated for collection ${collectionName}`,
      data: {
        collectionName,
        permissions: newPermissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
