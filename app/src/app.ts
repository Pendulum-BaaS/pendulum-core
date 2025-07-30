import express from "express";
import crudRoutes from "./routes/crudRoutes";
import authRoutes from "./routes/authRoutes";
import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandlingAndValidation/errorHandler";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

// Routes
app.use("/api", crudRoutes);
app.use("/auth", authRoutes);

app.use(notFoundHandler); // 404 handler for invalid routes
app.use(errorHandler); // global error handler

export default app;
