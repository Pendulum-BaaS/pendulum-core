import * as mongo from "mongodb";
import dotenv from "dotenv";
import { mongoClient } from "./mongoClient";

dotenv.config();

type SortKey = Record<string, 1 | -1>;

interface PaginatedResult {
  data: mongo.Document[];
  totalDocuments: number;
  limit: number;
  offset: number;
}

interface ModifiedResult {
  matchedCount: number;
  modifiedCount: number;
}

export const getOne = async (
  collectionName: string,
  id: string,
): Promise<mongo.Document> => {
  const convertedId = new mongo.ObjectId(id);

  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);

  const item = await collection.find({ _id: convertedId }).toArray();
  return item;
};

export const getSome = async (
  collectionName: string,
  limit: number = 10,
  offset: number = 0,
  sortKey: SortKey = { _id: -1 },
  ids: string = "",
): Promise<PaginatedResult> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);

  let filter = {};
  if (ids) {
    const parsedIds = ids.split(",").map((id) => new mongo.ObjectId(id.trim()));
    filter = { _id: { $in: parsedIds } };
  }

  const data = await collection
    .find(filter)
    .sort(sortKey)
    .limit(limit)
    .skip(offset * limit)
    .toArray();
  const totalDocuments = await collection.countDocuments(filter);

  return { data, totalDocuments, limit, offset };
};

export const getAll = async (
  collectionName: string,
): Promise<mongo.Document[]> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);

  const items = await collection.find({}).toArray();
  return items;
};

export const insert = async (
  collectionName: string,
  newItems: object[],
): Promise<any> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const result = await collection.insertMany(newItems);

  const insertedDocs = await collection
    .find({
      _id: { $in: Object.values(result.insertedIds) },
    })
    .toArray();

  return insertedDocs;
};

export const updateOne = async (
  collectionName: string,
  id: string,
  updateOperation: Record<string, any>,
): Promise<any> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const convertedId = new mongo.ObjectId(id);

  const result = await collection.findOneAndUpdate(
    { _id: convertedId },
    updateOperation,
    { returnDocument: "after" },
  );

  return result;
};

export const updateSome = async (
  collectionName: string,
  filter: Record<string, any>,
  updateOperation: Record<string, any>,
): Promise<any[]> => {
  if (Object.keys(filter).length === 0) {
    return [];
  }

  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const documentsToUpdate = await collection.find(filter).toArray(); // find document IDs before updating

  await collection.updateMany(filter, updateOperation); // Update the matching documents

  const updatedDocuments = await collection.find({
    _id: { $in: documentsToUpdate.map(doc => doc._id) }
  }).toArray(); // Get the updated documents
  return updatedDocuments; // Return the actual updated documents
};

export const updateAll = async (
  collectionName: string,
  updateOperation: Record<string, any>,
): Promise<any[]> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  await collection.updateMany({}, updateOperation); //Update all documents

  const updatedDocuments = await collection.find({}).toArray(); // Get the updated documents with a separate find query
  return updatedDocuments; // Return the actual updated documents
};

export const replace = async (
  collectionName: string,
  id: string,
  newItem: object,
) => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const convertedId = new mongo.ObjectId(id);

  const result = await collection.findOneAndReplace(
    { _id: convertedId },
    newItem,
    { returnDocument: "after" }, // Return the document after replacement
  );

  return result; // Return the actual replaced document
};

export const removeOne = async (
  collectionName: string,
  id: string,
): Promise<any> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const convertedId = new mongo.ObjectId(id);
  const documentToDelete = await collection.findOne({ _id: convertedId });

  await collection.deleteOne({ _id: convertedId });
  return documentToDelete;
};

export const removeSome = async (
  collectionName: string,
  ids: string,
): Promise<any> => {
  // one or more _id requirement handled by validation middleware
  // ids is guaranteed to exist or 4XX response is sent
  const parsedIds = ids.split(",").map((id) => new mongo.ObjectId(id.trim()));
  const filter = { _id: { $in: parsedIds } };

  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const documentsToDelete = await collection.find(filter).toArray();

  await collection.deleteMany(filter);
  return documentsToDelete;
};

export const removeAll = async (collectionName: string): Promise<any> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);
  const documentsToDelete = await collection.find({}).toArray();

  await collection.deleteMany({});
  return documentsToDelete;
};

export const getSomeWithOwnership = async (
  collectionName: string,
  userId: string,
  limit: number = 10,
  offset: number = 0,
  sortKey: SortKey = { _id: -1 },
): Promise<PaginatedResult> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);

  const filter = { userId };
  const data = await collection
    .find(filter)
    .sort(sortKey)
    .limit(limit)
    .skip(offset * limit)
    .toArray();

  const totalDocuments = await collection.countDocuments(filter);

  await client.close();
  return { data, totalDocuments, limit, offset };
};

export const getAllWithOwnership = async (
  collectionName: string,
  userId: string,
): Promise<mongo.Document[]> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(collectionName);

  const filter = { userId };
  const items = await collection.find(filter).toArray();

  await client.close();
  return items;
};
