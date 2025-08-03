import { Request, Response } from "express";
import { eventEmitter } from "../models";

export const emitController = (req: Request, res: Response) => {
  try {
    const { eventType, collection, data } = req.body;

    console.log(
      `Internal event received: ${eventType} for collection: ${collection}`,
    );

    switch (eventType) {
      case "insert":
        eventEmitter.emitInsert(collection, data.insertedData, data.operationId);
        break;
      case "update":
        eventEmitter.emitUpdate(
          collection,
          data.filter,
          data.updatedData,
          data.updateOperation,
          data.operationId
        );
        break;
      case "delete":
        eventEmitter.emitDelete(collection, data.filter, data.deletedData, data.operationId);
        break;
    }

    res.send({ success: true });
  } catch (error) {
    console.error(`Error processing internal event: ${error}`);
    res.status(500).send({ error: "Failed to process event" });
  }
};
