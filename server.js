import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(root, 'dist');
const port = Number(process.env.HTTP_PORT || 3000);
const baseUrl = process.env.BASE_URL?.trim();
const requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 30 * 60 * 1000);

if (!baseUrl) {
  console.error('ERROR: BASE_URL environment variable is required.');
  console.error('Example: BASE_URL=http://prodbackend.mcs.local:3005 node server.js');
  process.exit(1);
}

const app = express();

app.get('/__health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(
  '/api',
  createProxyMiddleware({
    target: baseUrl,
    changeOrigin: true,
    // Express удаляет mount path `/api` из req.url. Backend ConstrTodo ожидает
    // исходный путь, поэтому явно восстанавливаем req.originalUrl.
    pathRewrite: (_path, req) => req.originalUrl,
    proxyTimeout: requestTimeout,
    timeout: requestTimeout,
    on: {
      proxyReq: (_proxyReq, req) => {
        console.log(`[proxy] --> ${req.method} ${req.originalUrl} -> ${baseUrl}${req.originalUrl}`);
      },
      proxyRes: (proxyRes, req) => {
        console.log(`[proxy] <-- ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      },
      error: (error, req, res) => {
        console.error(`[proxy] error ${req.method} ${req.originalUrl}: ${error.message}`);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Backend is unavailable' });
        }
      },
    },
  }),
);

app.use(express.static(distPath, {
  etag: true,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.get('{*path}', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Acoustic Calc frontend listening on :${port}`);
  console.log(`Proxying /api/* to ${baseUrl}/api/*`);
});
