import { DatabaseEvent } from "../types";
import { Response } from "express";

class SSEManager {
  private clients: Set<Response> = new Set();

  addClient(res: Response) {
    this.clients.add(res);
    console.log(
      `Client connected successfully. Total clients: ${this.getClientCount()}`,
    );
  }

  removeClient(res: Response) {
    this.clients.delete(res);
    console.log(
      `Client disconnected successfully. Total clients: ${this.getClientCount()}`,
    );
  }

  broadcast(data: DatabaseEvent) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    console.log(`Broadcasting to ${this.getClientCount()} clients:`, data);

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (error) {
        console.error("Error sending to client:", error);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
