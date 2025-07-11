import express from 'express';
import crudRoutes from './routes/crudRoutes';
// import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json()); // parses request bodies as JSON

// Routes
app.use('/api', crudRoutes);


export default app;
