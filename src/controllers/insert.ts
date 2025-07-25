import { Request, Response, NextFunction } from "express";
import { insert } from "../models/dbmethods";
import { eventEmitter } from "../events/eventEmitter";

export const insertController = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, newItems } = req.body; // collection validated and sanitized in middleware
  const result = await insert(collection, newItems);
  eventEmitter.emitInsert(collection, result);
  res.json(result);
};
