import * as mongo from "mongodb";
import dotenv from "dotenv";
import { UserRole, USER_ROLES } from "./roleDefinitions";
import { mongoClient } from "./mongoClient";

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
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const userWithDefaults: User = {
    ...userData,
    role: userData.role || USER_ROLES.user, // default to user role
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await collection.insertOne(userWithDefaults);
  return !!result.insertedId;
};

export const loginUser = async (
  identifier: string,
  isEmailLogin: boolean,
): Promise<mongo.WithId<mongo.BSON.Document> | null> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const query = isEmailLogin ? { email: identifier } : { username: identifier };
  const result = await collection.findOne(query);
  return result;
};

export const updateRole = async (
  userId: string,
  newRole: UserRole,
): Promise<boolean> => {
  const db = mongoClient.db(process.env.DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.updateOne(
    { _id: new mongo.ObjectId(userId) },
    { $set: { role: newRole, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
};
