import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URL as string;
export const mongoClient = new MongoClient(uri, {
  maxPoolSize: 200,
  maxConnecting: 2,
});
