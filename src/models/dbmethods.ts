import * as mongo from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

type SortKey = Record<string, 1 | -1>;

interface PaginatedResult {
  data: mongo.Document[];
  totalDocuments: number;
  limit: number;
  offset: number;
}

interface UpdateOptions {
  id?: string;
  filter?: Record<string, any>;
  updateOperation: Record<string, any>;
}

interface ModifiedResult {
  matchedCount: number;
  modifiedCount: number;
}

type DeleteOptions = Omit<UpdateOptions, 'updateOperation'>;

export const getAll = async (collectionName: string): Promise<mongo.Document[]> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  const items = await collection.find({}).toArray();
  await client.close();
  return items;
};

export const getOne = async (collectionName: string, id: string): Promise<mongo.Document> => {
  const convertedId = new mongo.ObjectId(id);

  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  const item = await collection.find({_id: convertedId}).toArray();
  await client.close();
  return item;
};

export const getSome = async(
  collectionName: string,
  limit: number = 10,
  offset: number = 0,
  sortKey: SortKey = { _id: -1 } 
): Promise<PaginatedResult> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  const data = await collection.find({})
                               .sort(sortKey)
                               .limit(limit)
                               .skip(offset * limit)
                               .toArray();
  const totalDocuments = await collection.countDocuments();
  
  await client.close();
  return { data, totalDocuments, limit, offset };
}

export const insert = async (collectionName: string, newItems: object[]): Promise<string[]> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  const result = await collection.insertMany(newItems);

  await client.close();
  return Object.values(result.insertedIds).map(String);
};

export const update = async (
  collectionName: string,
  options: UpdateOptions,
): Promise<ModifiedResult> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  
  let result: mongo.UpdateResult;

  if (options.id !== undefined) {
    const convertedId = new mongo.ObjectId(options.id);
    result = await collection.updateOne({ _id: convertedId }, options.updateOperation);
  } else {
    const filter = options.filter ?? {};
    result = await collection.updateMany(filter, options.updateOperation);
  }
  
  await client.close();
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

export const replace = async (collectionName: string, id: string, newItem: object) => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  const convertedId = new mongo.ObjectId(id);
  const result = await collection.replaceOne({ _id: convertedId }, newItem);

  await client.close();

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

export const remove = async (collectionName: string, options: DeleteOptions): Promise<number> => {
  if (options.filter === undefined || Object.keys(options.filter).length === 0) return 0;

  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  
  let result: mongo.DeleteResult;

  if (options.id !== undefined) {
    const convertedId = new mongo.ObjectId(options.id)
    result = await collection.deleteOne({ _id: convertedId })
  } else {
    result = await collection.deleteMany(options.filter);
  }

  await client.close();
  return result.deletedCount;
}

export const removeAll = async (collectionName: string): Promise<number> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  // add validation logic later
  const collection = db.collection(collectionName);
  
  const result = await collection.deleteMany({});

  await client.close();
  return result.deletedCount;
}