import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Function to get the MongoDB URL based on environment
const getMongoUrl = (): string => {
  // Check if we have AWS DocumentDB variables (injected by ECS from Secrets Manager)
  if (process.env.DATABASE_ENDPOINT && process.env.DB_USER && process.env.DB_PW) {
    // AWS deployment - construct DocumentDB connection string
    const dbName = process.env.DB_NAME || 'pendulum';
    const encodedUser = encodeURIComponent(process.env.DB_USER);
    const encodedPassword = encodeURIComponent(process.env.DB_PW);
    
    const url = `mongodb://${encodedUser}:${encodedPassword}@` +
                `${process.env.DATABASE_ENDPOINT}:27017/${dbName}?tls=true&` +
                `tlsCAFile=/tmp/global-bundle.pem&replicaSet=rs0&` +
                `readPreference=secondaryPreferred&retryWrites=false&` +
                `authMechanism=SCRAM-SHA-1`;
    
    console.log('Using AWS DocumentDB connection');
    return url;
  } else if (process.env.MONGO_URL) {
    // Local development with Docker Compose
    console.log('Using local MongoDB connection');
    return process.env.MONGO_URL;
  } else {
    throw new Error('MongoDB configuration missing.');
  }
};

const uri = getMongoUrl();
export const mongoClient = new MongoClient(uri, {
  maxPoolSize: 200,
  maxConnecting: 2,
});
