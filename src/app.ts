import express from "express";
import crudRoutes from "./routes/crudRoutes";
import authRoutes from "./routes/authRoutes";
import { Request, Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json()); // parses request bodies as JSON

// Routes
app.use("/api", crudRoutes);
app.use("/auth", authRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

app.use(notFoundHandler); // 404 handler for invalid routes
app.use(errorHandler); // global error handler

export default app;
