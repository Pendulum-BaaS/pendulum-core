import { Request, Response, NextFunction } from 'express';
import { updateOne, updateSome, updateAll } from '../models/dbmethods';

export const one = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const collection = String(req.body.collection);
    const updateOperation = req.body.updateOperation;

    const result = await updateOne(collection, id, updateOperation);
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
    res.json(result);
  } catch (error) {
    console.log(error); // ERROR HANDLING LATER
  }
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = String(req.body.collection);
    const updateOperation = req.body.updateOperation;

    const result = await updateAll(collection, updateOperation);
    res.json(result);
  } catch (error) {
    console.log(error); // ERROR HANDLING LATER
  }
};
