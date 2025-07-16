import express, { response } from 'express';
import crudRoutes from './routes/crudRoutes';
import { Request, Response, NextFunction } from "express";
// import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json()); // parses request bodies as JSON

// Routes
app.use('/api', crudRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.sendStatus(200);
});

export default app;
