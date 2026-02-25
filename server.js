import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error('ERROR: BASE_URL environment variable is required.');
  console.error('Example: BASE_URL=http://localhost:3005 node server.js');
  process.exit(1);
}

const app = express();

app.use(
  '/api',
  createProxyMiddleware({
    target: BASE_URL,
    changeOrigin: true,
  })
);

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Proxying /api/* -> ${BASE_URL}/api/*`);
});