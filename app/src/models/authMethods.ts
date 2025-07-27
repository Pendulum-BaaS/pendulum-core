import * as mongo from "mongodb";
import dotenv from "dotenv";
import { mongoClient } from "./mongoClient";

dotenv.config();

export interface User {
  username: string;
  email: string;
  password: string;
}

const COLLECTION_NAME = "users";

export const addUser = async (userData: User): Promise<boolean> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  const result = await collection.insertOne(userData);
  return !!result.insertedId;
};

export const loginUser = async (
  username: string,
): Promise<mongo.WithId<mongo.BSON.Document> | null> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  const result = await collection.findOne({ username: username });
  return result;
};
