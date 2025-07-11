import { Request, Response, NextFunction } from "express";
import { insert } from "../models/dbmethods";

export const insertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collection, newItems } = req.body;
    const result = await insert(collection, newItems);
    res.json(result);
  } catch (error) {
    console.error(error);
  }
};
