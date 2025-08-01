import { Request, Response, NextFunction } from "express";
import morgan from "morgan";

const sseClients = new Set<Response>();

// stores connected clients as Response objects to call .write() method on
export const sseLogsEndpoint = (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => sseClients.delete(res));
};

morgan.token("user-id", (req: Request) => {
  return (req as any).user?.userId || "anonymous";
});

export const sseLoggerMiddleware = morgan(
  ":method :url :status :response-time :user-agent :remote-addr :user-id",
  {
    stream: {
      write: (message: string) => {
        const logParts = message.trim().split(" ");
        const logEntry = {
          timestamp: new Date().toISOString(),
          method: logParts[0],
          url: logParts[1],
          status: logParts[2],
          duration: logParts[3] + "ms",
          userAgent: logParts.slice(4, -2).join(" ") || "unknown",
          ip: logParts[logParts.length - 2],
          userId: logParts[logParts.length - 1],
        };

        const data = `data: ${JSON.stringify({ type: "log", data: logEntry })}\n\n`;
        sseClients.forEach((client) => {
          try {
            client.write(data);
          } catch {
            sseClients.delete(client);
          }
        });
        return true;
      },
    },
  },
);
