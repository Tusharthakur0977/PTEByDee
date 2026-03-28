import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware';
import routes from './routes/index';
import path from 'path';
import favicon from 'serve-favicon';

dotenv.config();

const app: Application = express();
const corsOptions = {
  origin: [
    'https://www.ptebydee.com.au',
    'https://ptebydee.com.au',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

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
  }),
);

// Compression middleware
app.use(compression());

// Rate limiting
app.use(generalRateLimiter);

// Special handling for Stripe webhooks (raw body needed)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
  res.send('PTE Backend API is running...');
});

// Mount all routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
