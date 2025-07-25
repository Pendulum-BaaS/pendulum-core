import { Request, Response, NextFunction } from "express";
import { insert } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";

export const insertController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { collection, newItems } = req.body;
  const result = await insert(collection, newItems);
  eventClient.emitInsert(collection, result);
  res.json(result);
};
