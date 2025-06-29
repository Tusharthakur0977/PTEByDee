// src/app.ts
import { errorHandler, notFound } from './middlewares/error.middleware';
import routes from './routes/index';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
dotenv.config(); // Load environment variables

const app: Application = express();

app.use(cors());
// Middleware to parse JSON body requests
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('PTE AI Backend API is running...');
});

// Mount all routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
