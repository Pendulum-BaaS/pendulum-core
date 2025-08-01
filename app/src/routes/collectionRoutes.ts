import { Response, NextFunction } from "express";
import { collectionsManager } from "../models/collections";
import { Router } from "express";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
} from "../middleware/rbac/roleAuth";
import { getAuthenticatedUser } from "../utils/auth";

const collectionRouter = Router();

collectionRouter.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { newCollection } = req.body;
      const user = getAuthenticatedUser(req);

      if (/\s+/.test(newCollection.trim())) {
        throw new Error(
          "Invalid collection name. No whitespace characters allowed.",
        );
      }

      const createdBy = user.userId;
      const sanitizedNewCollection = newCollection.trim();
      await collectionsManager.createCollection(
        sanitizedNewCollection,
        createdBy,
      );
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  },
);

export default collectionRouter;
