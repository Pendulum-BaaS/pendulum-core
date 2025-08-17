import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;
let testMongoClient: MongoClient;

beforeAll(async () => {
  // start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URL = uri;
  process.env.DB_NAME = 'test_pendulum';
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.ADMIN_KEY = 'test_admin_key';
  process.env.EVENTS_SERVICE_URL = 'http://localhost:8080';

  // connect to test database
  testMongoClient = new MongoClient(uri);
  await testMongoClient.connect();

  // set up the mock implementation
  const mongoMock = require('../src/models/mongoClient');
  mongoMock.mongoClient = testMongoClient;
});

afterAll(async () => {
  await testMongoClient?.close();
  await mongoServer?.stop();
});

afterEach(async () => {
  if (testMongoClient) {
    const db = testMongoClient.db('test_pendulum');
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
});
