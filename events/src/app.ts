import express from "express";
import cors from "cors";
import { Request, Response } from "express";
import sseRouter from "./routes/sseRoutes";
import internalRouter from "./routes/internalRoutes";
import { sseManager } from "./models";

export const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/pendulum-events/internal", internalRouter);
app.use("/pendulum-events/events", sseRouter);

app.get("/pendulum-events/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    clients: sseManager.getClientCount(),
    uptime: process.uptime(),
  });
});

export default app;
