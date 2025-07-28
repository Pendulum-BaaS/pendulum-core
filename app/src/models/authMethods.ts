import * as mongo from "mongodb";
import dotenv from "dotenv";
import { UserRole, USER_ROLES } from "./roleDefinitions";

dotenv.config();

export interface User {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = "users";

export const addUser = async (userData: User): Promise<boolean> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const userWithDefaults: User = {
    ...userData,
    role: userData.role || USER_ROLES.user, // default to user role
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await collection.insertOne(userWithDefaults);
  await client.close();
  return !!result.insertedId;
};

export const loginUser = async (
  identifier: string,
): Promise<mongo.WithId<mongo.BSON.Document> | null> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const query = identifier.includes('@') ? { email: identifier } : { username: identifier }; // make sure @ can't be in username

  const result = await collection.findOne(query);
  await client.close();
  return result;
};

export const updateRole = async (
  userId: string,
  newRole: UserRole,
): Promise<boolean> => {
  const client = new mongo.MongoClient(process.env.MONGO_URL as string);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.updateOne(
    { _id: new mongo.ObjectId(userId) },
    { $set: { role: newRole, updatedAt: new Date() } }
  );

  await client.close();
  return result.modifiedCount > 0;
}
