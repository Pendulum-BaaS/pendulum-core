import { Request, Response } from "express";
import { sseManager } from "../models";

export const eventsController = (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  res.write(
    `data: ${JSON.stringify({ type: "connection", message: "Connected to SSE Server" })}\n\n`,
  ); // send initial connection confirmation

  sseManager.addClient(res);

  req.on("close", () => {
    sseManager.removeClient(res);
  });

  req.on("aborted", () => {
    sseManager.removeClient(res);
  });
};
