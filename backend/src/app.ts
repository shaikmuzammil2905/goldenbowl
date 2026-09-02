import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app: Express = express();

// 1. Helmet Security Headers
app.use(helmet());

// 2. CORS Security Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'https://goldenfoodbowl.com',
        'https://www.goldenfoodbowl.com',
        'https://goldenbowl.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
      ];
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('goldenfoodbowl.com')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for prototype & production domain variations
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-email', 'Pragma', 'Cache-Control'],
  })
);

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per IP per window
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 4. Request Logging & Body Parsing
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 5. Health Check Endpoints (Both /health and /api/health)
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'goldenbowl-api',
    timestamp: new Date().toISOString(),
  });
});

// 6. Disable caching for dynamic API endpoints to ensure real-time cross-device sync
app.use('/api', (req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Primary REST API Router
app.use('/api', apiRouter);

// 7. 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// 8. Global Error Handling Middleware
app.use(errorHandler);

export default app;
