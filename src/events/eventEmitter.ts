import { EventEmitter } from 'events';

interface DatabaseEvent {
  collection: string;
  action: "insert" | "update" | "delete"; // make symbol?
  eventData: {
    affected?: any[];      // The database records that were affected
    filter?: any;          // For update/delete operations, what filter was used
    updateOperation?: any; // For update operations, what changes were made
    count?: number;        // How many records were affected
    ids?: string[];        // IDs of affected records
  }
}

export const DB_EVENTS = { // helpful or cumbersome?
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

class DatabaseEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
    this.on('newListener', (event) => {
      console.log(`New listener added for event ${event}`);
    });
  }

  emitInsert(collection: string, insertedData: any[]) {
    const event: DatabaseEvent = {
      collection,
      action: 'insert',
      eventData: {
        affected: insertedData,
        count: insertedData.length,
        ids: insertedData.map(item => item._id || item.id).filter(Boolean) // only need ._id?
      },
    };

    console.log(`Emitting insert event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.INSERT, event);
  };

  emitUpdate(collection: string, filter: any, updatedData: any[], updateOperation: any) {
    const event: DatabaseEvent = {
      collection,
      action: 'update',
      eventData: {
        affected: updatedData,
        filter,
        updateOperation,
        count: updatedData.length,
        ids: updatedData.map(item => item._id || item.id).filter(Boolean) // only need ._id?
      },
    };

    console.log(`Emitting update event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.UPDATE, event);
  };

  emitDelete(collection: string, filter: any, deletedData: any[]) {
    const event: DatabaseEvent = {
      collection,
      action: 'delete',
      eventData: {
        affected: deletedData,
        filter,
        count: deletedData.length,
        ids: deletedData.map(item => item._id || item.id).filter(Boolean) // only need ._id?
      },
    };

    console.log(`Emitting delete event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.DELETE, event);
  };

  // Listen for events (attach event listeners?)
  onDatabaseEvent(callback: (event: DatabaseEvent) => void) {
    this.on(DB_EVENTS.INSERT, callback);
    this.on(DB_EVENTS.UPDATE, callback);
    this.on(DB_EVENTS.DELETE, callback);
  }

  // Cleanup
  removeAllDatabaseListeners() {
    this.removeAllListeners(DB_EVENTS.INSERT);
    this.removeAllListeners(DB_EVENTS.UPDATE);
    this.removeAllListeners(DB_EVENTS.DELETE);
  }
}

// create singleton instance to be used by SSE server & controllers
const eventEmitter = new DatabaseEventEmitter();

export { eventEmitter }
export type { DatabaseEvent }
