import { Request, Response, NextFunction } from 'express';
import { updateOne, updateSome, updateAll } from '../models/dbmethods';
import { eventEmitter } from '../events/eventEmitter';

export const one = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const collection = String(req.body.collection);
    const updateOperation = req.body.updateOperation;
    const filter = { _id: id };
  
    const result = await updateOne(collection, id, updateOperation);
    eventEmitter.emitUpdate(collection, filter, [result], updateOperation);
    res.json(result);
  } catch (error) {
    console.log(error); // ERROR HANDLING LATER
  }
};

export const some = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = String(req.body.collection);
    const filter = req.body.filter;
    const updateOperation = req.body.updateOperation;

    const result = await updateSome(collection, filter, updateOperation);
    eventEmitter.emitUpdate(collection, filter, result, updateOperation);
    res.json(result);
  } catch (error) {
    console.log(error); // ERROR HANDLING LATER
  }
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = String(req.body.collection);
    const updateOperation = req.body.updateOperation;
    const filter = {};

    const result = await updateAll(collection, updateOperation);
    eventEmitter.emitUpdate(collection, filter, result, updateOperation);
    res.json(result);
  } catch (error) {
    console.log(error); // ERROR HANDLING LATER
  }
};
