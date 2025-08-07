import axios from "axios";

const EVENTS_SERVICE_URL =
  process.env.EVENTS_SERVICE_URL || "http://localhost:8080";

interface EventData {
  insertedData?: any[];
  filter?: any;
  updatedData?: any[];
  updateOperation?: any;
  deletedData?: any[];
  operationId: string;
}

export class EventClient {
  private async sendEvent(
    eventType: string,
    collection: string,
    data: EventData,
  ) {
    try {
      await axios.post(`${EVENTS_SERVICE_URL}/pendulum-events/internal/emit`, {
        eventType,
        collection,
        data,
      });
      console.log(`Event emitted successfully: ${eventType} for ${collection}`);
    } catch (error) {
      console.error(`Failed to emit ${eventType} for ${collection}: ${error}`);
    }
  }

  async emitInsert(
    collection: string,
    insertedData: any[],
    operationId: string
  ) {
    await this.sendEvent("insert", collection, { insertedData, operationId });
  }

  async emitUpdate(
    collection: string,
    filter: any,
    updatedData: any[],
    updateOperation: any,
    operationId: string,
  ) {
    await this.sendEvent("update", collection, {
      filter,
      updatedData,
      updateOperation,
      operationId,
    });
  }

  async emitDelete(
    collection: string,
    filter: any,
    deletedData: any[],
    operationId: string
  ) {
    await this.sendEvent("delete", collection, {
      filter,
      deletedData,
      operationId,
    });
  }
}

export const eventClient = new EventClient();
