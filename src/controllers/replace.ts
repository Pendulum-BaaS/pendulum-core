import { Request, Response, NextFunction } from "express";
import { replace } from "../models/dbmethods";

export const replaceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { collection, newItem } = req.body;
    const result = await replace(collection, id, newItem);
    res.json(result);
  } catch (error) {
    console.error(error);
  }
};
