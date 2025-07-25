import { eventEmitter } from "./models";
import { sseManager } from "./models";
import app from "./app";
import { DatabaseEvent } from "./types";

eventEmitter.onDatabaseEvent((event: DatabaseEvent) => {
  console.log("SSE Server received database event:", event);
  sseManager.broadcast(event); // Broadcast database event to all connected clients
});

const SSE_PORT = 8080;
app.listen(SSE_PORT, () => {
  console.log(`SSE Server running on port ${SSE_PORT}`);
});
