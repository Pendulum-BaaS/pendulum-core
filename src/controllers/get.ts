import { Request, Response, NextFunction } from 'express';
import { getOne, getSome, getAll } from '../models/dbmethods';

export const one = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const collection = String(req.query.collection);

    const result = await getOne(collection, id);
    res.json(result);
  } catch (error) {
    console.log(error) // ERROR HANDLING LATER
  }
};

const formatSortKey = (sortFields: string): Record<string, -1 | 1> => {
  const fields = sortFields.split(',');
  const sortKey: Record<string, -1 | 1> = {};

  fields.forEach(field => {
    sortKey[field] = field.startsWith('-') ? -1 : 1;
  });

  return sortKey;
};

export const some = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collection, limit, offset, sortKey } = req.query as { [key: string]: string };
    const parsedLimit = limit ? Number(limit) : 5;
    const parsedOffset = offset ? Number(offset) : 0;
    const parsedSortKey = formatSortKey(sortKey);

    const result = await getSome(collection, parsedLimit, parsedOffset, parsedSortKey);
    res.json(result);
  } catch (error) {
    console.log(error) // ERROR HANDLING LATER
  }
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = String(req.query.collection);
    const result = await getAll(collection);
    res.json(result);
  } catch (error) {
    console.log(error) // ERROR HANDLING LATER
  }
};
