import { UserRole } from "./roleDefinitions";
import { mongoClient } from "./mongoClient"; // already configured MongoDB client instance that handles both local and AWS DocumentDB connections
import dotenv from 'dotenv';

dotenv.config();

interface CollectionPermissions {
  create: UserRole[];
  read: UserRole[];
  update: UserRole[];
  delete: UserRole[];
}

interface CollectionMetadata {
  collectionName: string;
  permissions: CollectionPermissions;
  createdBy: string;
  createdAt: Date;
}

export class CollectionsManager {
  private collections: { [key: string]: CollectionMetadata } = {};
  private readonly COLLECTION_METADATA = 'collection_metadata'; // Need this as a constant???
  private defaultPermissions: CollectionPermissions = {
    create: ['admin', 'user', 'public'],
    read: ['admin', 'user', 'public'],
    update: ['admin', 'user', 'public'],
    delete: ['admin', 'user', 'public'],
  };

  constructor() {
    this.loadCollectionsFromDb();
  }

  private async loadCollectionsFromDb(): Promise<void> {
    try {
      const db = mongoClient.db(process.env.DB_NAME); // connect to either documentdb or local docker compose mongodb, db references DB_NAME database
      const metadataCollection = db.collection(this.COLLECTION_METADATA); // create collection in db called 'collection_metadata'
      const existingCollections = await metadataCollection.find({}).toArray(); // pull all existing collections into metadataCollections

      existingCollections.forEach(collection => {
        this.collections[collection.collectionName] = {
          collectionName: collection.collectionName,
          permissions: collection.permissions,
          createdBy: collection.createdBy,
          createdAt: collection.createdAt,
        };
      });

      console.log(`Loaded ${existingCollections.length} collections from database`);
    } catch (error) {
      console.error('Failed to load collections from database:', error); // continue w/ empty collection object, app still functions
    }
  }

  async createCollection(
    collectionName: string,
    createdBy: string,
    permissions?: Partial<CollectionPermissions>
  ): Promise<CollectionMetadata> {
    if (collectionName in this.collections) {
      throw new Error(`Collection ${collectionName} already exists`); // USE CUSTOM ERROR CLASS
    }

    const collectionMetadata: CollectionMetadata = {
      collectionName,
      permissions: { ...this.defaultPermissions, ...permissions},
      createdBy,
      createdAt: new Date(),
    }

    try {
      const db = mongoClient.db(process.env.DB_NAME);
      const metadataCollection = db.collection(this.COLLECTION_METADATA);
      await metadataCollection.insertOne(collectionMetadata);

      this.collections[collectionName] = collectionMetadata;
    } catch (error) {
      console.error('Failed to save collection to database:', error); // USE CUSTOM ERROR CLASS
      throw error;
    }

    return collectionMetadata;
  };

  canPerformAction(
    userId: string,
    userRole: UserRole,
    collectionName: string,
    action: keyof CollectionPermissions
  ): boolean {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} does not exist`); // USE CUSTOM ERROR CLASS

    const roleAllowed = collection.permissions[action].includes(userRole);
    const isCreator = this.isCollectionCreator(userId, collectionName);
    
    return roleAllowed || isCreator;
  }

  isCollectionCreator(userId: string, collectionName: string): boolean {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} does not exist`);

    return collection.createdBy === userId;
  }

  getCollectionPermissions(collectionName: string): CollectionPermissions {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} does not exist`);

    return collection.permissions;
  }

  async updateCollectionPermissions(
    collectionName: string,
    newPermissions: Partial<CollectionPermissions>
  ): Promise<boolean> {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} does not exist`);

    const updatedPermissions = { // needed deep copy
      ...JSON.parse(JSON.stringify(collection.permissions)),
      ...JSON.parse(JSON.stringify(newPermissions)),
    };

    try {
      const db = mongoClient.db(process.env.DB_NAME);
      const metadataCollection = db.collection(this.COLLECTION_METADATA);
      await metadataCollection.updateOne({ collectionName }, { $set: { permissions: updatedPermissions } });
      collection.permissions = updatedPermissions; // don't mutate collections until db updates successfully
      return true;
    } catch (error) {
      console.error('Failed to update collection permissions in database', error);
      throw error;
    }
  }

  getAllCollections(): CollectionMetadata[] {
    return Object.values(this.collections);
  }

  collectionExists(collectionName: string): boolean {
    return collectionName in this.collections;
  }
}

