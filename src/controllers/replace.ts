import { Request, Response, NextFunction } from "express";
import { replace } from "../models/dbmethods";
import { eventEmitter } from "../events/eventEmitter";

export const replaceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { collection, newItem } = req.body;
    const filter = { _id: id };
    const result = await replace(collection, id, newItem);

    eventEmitter.emitUpdate(collection, filter, [result], { $set: newItem }); // is there a way to remove result from an array?
    res.json(result);
  } catch (error) {
    console.error(error);
  }
};
