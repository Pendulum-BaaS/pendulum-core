import { Request, Response, NextFunction } from "express";
import { replace } from "../models/dbmethods";
import { eventEmitter } from "../events/eventEmitter";

export const replaceController = async (req: Request, res: Response, next: NextFunction) => {
  const id = String(req.params.id); // validated and sanitized in middleware
  const { collection, newItem } = req.body; // validated and sanitized in middleware
  const filter = { _id: id };
  const result = await replace(collection, id, newItem);

  eventEmitter.emitUpdate(collection, filter, [result], { $set: newItem }); // is there a way to remove result from an array?
  res.json(result);
};
