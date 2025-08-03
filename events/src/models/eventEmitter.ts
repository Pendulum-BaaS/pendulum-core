import { EventEmitter } from "events";
import { DatabaseEvent } from "../types";

const DB_EVENTS = {
  INSERT: "insert",
  UPDATE: "update",
  DELETE: "delete",
} as const;

class DatabaseEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
    this.on("newListener", (event) => {
      console.log(`New listener added for event ${event}`);
    });
  }

  emitInsert(collection: string, insertedData: any[], operationId: string) {
    const event: DatabaseEvent = {
      collection,
      action: "insert",
      operationId,
      eventData: {
        affected: insertedData,
        count: insertedData.length,
        ids: insertedData.map((item) => item._id || item.id).filter(Boolean),
      },
    };

    console.log(`Emitting insert event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.INSERT, event);
  }

  emitUpdate(
    collection: string,
    filter: any,
    updatedData: any[],
    updateOperation: any,
    operationId: string
  ) {
    const event: DatabaseEvent = {
      collection,
      action: "update",
      operationId,
      eventData: {
        affected: updatedData,
        filter,
        updateOperation,
        count: updatedData.length,
        ids: updatedData.map((item) => item._id || item.id).filter(Boolean),
      },
    };

    console.log(`Emitting update event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.UPDATE, event);
  }

  emitDelete(collection: string, filter: any, deletedData: any[], operationId: string) {
    const event: DatabaseEvent = {
      collection,
      action: "delete",
      operationId,
      eventData: {
        affected: deletedData,
        filter,
        count: deletedData.length,
        ids: deletedData.map((item) => item._id || item.id).filter(Boolean),
      },
    };

    console.log(`Emitting delete event for collection: ${collection}`, event);
    this.emit(DB_EVENTS.DELETE, event);
  }

  onDatabaseEvent(callback: (event: DatabaseEvent) => void) {
    this.on(DB_EVENTS.INSERT, callback);
    this.on(DB_EVENTS.UPDATE, callback);
    this.on(DB_EVENTS.DELETE, callback);
  }

  removeAllDatabaseListeners() {
    this.removeAllListeners(DB_EVENTS.INSERT);
    this.removeAllListeners(DB_EVENTS.UPDATE);
    this.removeAllListeners(DB_EVENTS.DELETE);
  }
}

export const eventEmitter = new DatabaseEventEmitter();
