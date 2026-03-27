// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./src/routes');
const responseMiddleware = require('./src/middlewares/responseMiddleware');

const app = express();

// -------- simple, defensive parse of .env value --------
// .env should contain:
const raw = (process.env.CORS_ORIGINS || '').trim();

// remove accidental surrounding quotes/brackets if present
const cleaned = raw.replace(/^[\s"'\[]+|[\s"'\]]+$/g, '');
const allowedOrigins = cleaned
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

console.log('CORS_ORIGINS raw:', raw);
console.log('Allowed CORS origins:', allowedOrigins);

// -------- simple CORS middleware (no `cors` package required) --------
// This sets the CORS response headers only for allowed browser origins.
// If there is no Origin header (Postman, server-to-server), it will allow it.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // allow non-browser clients (no origin header)
  if (!origin) return next();

  if (allowedOrigins.length === 0) {
    // if you want to allow all origins, set allowedOrigins = ['*'] in your .env (not recommended)
    console.warn('CORS not configured: no allowed origins specified in .env');
    return res.status(403).json({ error: 'CORS_NOT_CONFIGURED' });
  }

  if (allowedOrigins.includes(origin)) {
    // allow this origin
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );

    // If preflight request, respond quickly
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  }

  // blocked origin
  return res.status(403).json({ error: 'CORS_NOT_ALLOWED', origin });
});

// If you prefer to use the cors package, the above logic is equivalent to
// using cors() with an origin function — but this explicit version avoids
// any accidental passing of arrays/strings to app.use as routes.
app.enable('trust proxy');
// ---------- remaining middleware & routes ----------
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve files from project-root "upload" folder
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), {
  fallthrough: false,
  maxAge: '7d'
}));

app.use(responseMiddleware);

// mount routes normally (ensure ./src/routes exports a Router)
app.use('/api', routes);

app.get('/health', (req, res) => res.status(200).json('OK'));

const PORT = process.env.PORT || 4567;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
