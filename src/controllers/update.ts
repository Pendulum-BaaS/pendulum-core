import { Request, Response, NextFunction } from 'express';
import { updateOne, updateSome, updateAll } from '../models/dbmethods';
import { eventEmitter } from '../events/eventEmitter';

export const one = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id; // validated and sanitized in middleware
  const { collection, updateOperation } = req.body.collection; // validated and sanitized in middleware
  const filter = { _id: id };

  const result = await updateOne(collection, id, updateOperation);
  eventEmitter.emitUpdate(collection, filter, [result], updateOperation);
  res.json(result);
};

export const some = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, filter, updateOperation } = req.body.collection; // validated and sanitized in middleware

  const result = await updateSome(collection, filter, updateOperation);
  eventEmitter.emitUpdate(collection, filter, result, updateOperation);
  res.json(result);
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, updateOperation } = req.body.collection; // validated and sanitized in middleware
  const filter = {};

  const result = await updateAll(collection, updateOperation);
  eventEmitter.emitUpdate(collection, filter, result, updateOperation);
  res.json(result);
};
