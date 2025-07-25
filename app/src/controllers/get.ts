import { Request, Response, NextFunction } from 'express';
import { getOne, getSome, getAll } from '../models/dbmethods';

export const one = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id; // validated and sanitized in middleware
  const collection = String(req.query.collection); // validated and sanitized in middleware

  const result = await getOne(collection, id);
  res.json(result);
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
  const { collection, limit, offset, sortKey } = req.query as { [key: string]: string }; // collection validated and sanitized in middleware
  const parsedLimit = limit ? Number(limit) : 5;
  const parsedOffset = offset ? Number(offset) : 0;
  const parsedSortKey: Record<string, 1 | -1> = sortKey ? formatSortKey(sortKey) : { _id: -1 };

  const result = await getSome(collection, parsedLimit, parsedOffset, parsedSortKey);
  res.json(result);
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  const collection = String(req.query.collection); // validated and sanitized in middleware
  const result = await getAll(collection);
  res.json(result);
};
