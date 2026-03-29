import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
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

// Запуск HTTP сервера
app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
  console.log(`Access via: http://localhost:${HTTP_PORT}`);
  console.log(`Proxying /api/* -> ${BASE_URL}/api/*`);
});

// Запуск HTTPS сервера
try {
  // В Docker контейнере сертификаты находятся в /app/certs/
  // В локальной разработке - в ./certs/
  const certPath = fs.existsSync(path.join(__dirname, 'certs'))
    ? path.join(__dirname, 'certs')
    : path.join(__dirname, '../certs');

  const httpsOptions = {
    key: fs.readFileSync(path.join(certPath, 'privkey.pem')),
    cert: fs.readFileSync(path.join(certPath, 'fullchain.pem'))
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
    console.log(`Access via: https://localhost:${HTTPS_PORT}`);
    console.log('Note: You may see a security warning for self-signed certificate');
  });
} catch (error) {
  console.error('Failed to start HTTPS server:', error.message);
  console.log('Make sure certificates exist in ./certs/ or ../certs/ directory');
  console.log('Run: ./generate-certs.sh to create them');
}