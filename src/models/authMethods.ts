import * as mongo from "mongodb";
import dotenv from "dotenv";

dotenv.config();

export interface User {
  username: string;
  email: string;
  password: string;
}

const COLLECTION_NAME = "users";

export const addUser = async (userData: User): Promise<boolean> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  const result = await collection.insertOne(userData);
  await client.close();
  return !!result.insertedId;
};
