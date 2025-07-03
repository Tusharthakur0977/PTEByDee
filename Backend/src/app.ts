import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware';
import routes from './routes/index';

dotenv.config();

const app: Application = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Rate limiting
app.use(generalRateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

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
