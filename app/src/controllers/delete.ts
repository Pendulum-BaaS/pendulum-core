import { Request, Response, NextFunction } from "express";
import { removeOne, removeSome, removeAll } from "../models/dbmethods";
import { eventClient } from "../utils/eventClient";
import { createError } from "../middleware/errorHandlingAndValidation/errorHandler";

export const one = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const collection = String(req.query.collection);
  const filter = { _id: id };

  const result = await removeOne(collection, id);
  eventClient.emitDelete(collection, filter, [result]);
  res.json(result);
};

const formatFilter = (query: Record<string, any>) => {
  const filter: Record<string, any> = {};

  Object.keys(query).forEach((key) => {
    if (key.includes("[") && key.includes("]")) {
      // Handle operators like price[gte]=100
      const [field, operator] = key.split("[");
      const op = operator.replace("]", "");

      if (!filter[field]) filter[field] = {};

      let value = query[key];

      // Handle different operators
      switch (op) {
        case "gte":
        case "gt":
        case "lte":
        case "lt":
          filter[field][`$${op}`] = Number(value);
          break;
        case "in":
        case "nin":
          filter[field][`$${op}`] = value.split(",");
          break;
        case "regex":
          filter[field].$regex = value;
          filter[field].$options = "i"; // case insensitive
          break;
      }
    } else {
      // Direct field match
      if (query[key] === "true") {
        filter[key] = true;
      } else if (query[key] === "false") {
        filter[key] = false;
      } else {
        filter[key] = query[key];
      }
    }
  });

  return filter;
};

export const some = async (req: Request, res: Response, next: NextFunction) => {
  const { collection, ...filter } = req.query;
  const sanitizedCollection = collection as string;
  const formattedFilter = formatFilter(filter);

  const result = await removeSome(sanitizedCollection, formattedFilter);
  eventClient.emitDelete(sanitizedCollection, filter, result);
  res.json(result);
};

export const all = async (req: Request, res: Response, next: NextFunction) => {
  const collection = String(req.query.collection);
  const filter = {};

  const result = await removeAll(collection);
  eventClient.emitDelete(collection, filter, result);
  res.json(result);
};
