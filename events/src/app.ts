import express from "express";
import cors from "cors";
import { Request, Response } from "express";
import internalRouter from "./routes/internalRoutes";
import sseRouter from "./routes/internalRoutes";
import { sseManager } from "./models";

export const app = express();
app.use(cors());
app.use(express.json());

app.use("/internal", internalRouter);
app.use("/events", sseRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    clients: sseManager.getClientCount(),
    uptime: process.uptime(),
  });
});

export default app;
