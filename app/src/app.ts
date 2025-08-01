import express from "express";
import crudRoutes from "./routes/crudRoutes";
import authRoutes from "./routes/authRoutes";
import { sseLogsEndpoint, sseLoggerMiddleware } from "./middleware/logger";
import collectionPermissionsRoutes from "./routes/collectionPermissionsRoutes";
import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandlingAndValidation/errorHandler";

const app = express();

app.use(express.json());

// middleware and controller for logging to admin dashboard
app.use(sseLoggerMiddleware);
app.get("/pendulum/logs", sseLogsEndpoint);

app.get("/pendulum/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

// Routes
app.use("/pendulum/api", crudRoutes);
app.use("/pendulum/auth", authRoutes);
app.use("/pendulum/permissions", collectionPermissionsRoutes);

app.use(notFoundHandler); // 404 handler for invalid routes
app.use(errorHandler); // global error handler

export default app;
