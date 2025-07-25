import { Request, Response, NextFunction } from "express";
import { updateOne, updateSome, updateAll } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";

export const one = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const { collection, updateOperation } = req.body.collection;
  const filter = { _id: id };

  const result = await updateOne(collection, id, updateOperation);
  eventClient.emitUpdate(collection, filter, [result], updateOperation);
  res.json(result);
};

export const some = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, filter, updateOperation } = req.body.collection;

  const result = await updateSome(collection, filter, updateOperation);
  eventClient.emitUpdate(collection, filter, result, updateOperation);
  res.json(result);
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, updateOperation } = req.body.collection;
  const filter = {};

  const result = await updateAll(collection, updateOperation);
  eventClient.emitUpdate(collection, filter, result, updateOperation);
  res.json(result);
};
