import cors from "cors";
import express from "express";
import crudRoutes from "./routes/crudRoutes";
import authRoutes from "./routes/authRoutes";
import collectionPermissionsRoutes from "./routes/collectionPermissionsRoutes";
import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandlingAndValidation/errorHandler";

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', // use * in development?
    'http://localhost:3000',
  ],
  credentials: true,
}));

app.use(express.json());


app.get("/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

// Routes
app.use("/api", crudRoutes);
app.use("/auth", authRoutes);
app.use("/permissions", collectionPermissionsRoutes);

app.use(notFoundHandler); // 404 handler for invalid routes
app.use(errorHandler); // global error handler

export default app;
