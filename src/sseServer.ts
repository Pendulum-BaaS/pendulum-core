import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';
import { eventEmitter, DatabaseEvent } from './events/eventEmitter';

class SSEManager {
  private clients: Set<Response> = new Set();

  addClient(res: Response) {
    this.clients.add(res);
    console.log(`Client connected successfully. Total clients: ${this.getClientCount()}`);
  }

  removeClient(res: Response) {
    this.clients.delete(res);
    console.log(`Client disconnected successfully. Total clients: ${this.getClientCount()}`);
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

const sseManager = new SSEManager();
eventEmitter.onDatabaseEvent((event: DatabaseEvent) => {
  console.log('SSE Server received database event:', event);
  sseManager.broadcast(event); // Broadcast database event to all connected clients
});

const app = express();
app.use(cors());
app.use(express.json());

// SSE Endpoint to set up intiial connection
app.get('/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*', // Is this necessary?
    'Access-Control-Allow-Headers': 'Cache-Control' // Is this necessary?
  });

  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to SSE Server' })}\n\n`); // send initial connection confirmation

  sseManager.addClient(res);

  req.on('close', () => {
    sseManager.removeClient(res)
  });

  // necessary? For failed/errored connections/
  req.on('aborted', () => {
    sseManager.removeClient(res)
  });
});

// API endpoint to broadcast messages to clients connected
app.post('/events', (req: Request, res: Response) => {
  const { collection, action, eventData } = req.body;

  if (!collection || !action) {
    return res.status(400).json({ error: 'collection and action are required' });
  }

  const sseData: DatabaseEvent = { collection, action, eventData };
  sseManager.broadcast(sseData);

  res.json({
    success: true,
    message: `Event broadcasted to ${sseManager.getClientCount()} clients`,
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    clients: sseManager.getClientCount(),
    uptime: process.uptime(),
  });
});

export { sseManager };

const SSE_PORT = 8080;
app.listen(SSE_PORT, () => {
  console.log(`SSE Server running on port ${SSE_PORT}`);
});
