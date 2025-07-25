import { Request, Response, NextFunction } from "express";
import { replace } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";

export const replaceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = String(req.params.id);
  const { collection, newItem } = req.body;
  const filter = { _id: id };
  const result = await replace(collection, id, newItem);

  eventClient.emitUpdate(collection, filter, [result], { $set: newItem });
  res.json(result);
};
