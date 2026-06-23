import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.HTTP_PORT) || 3000;
// Бэкенд без суффикса /api — префикс добавляем при проксировании (backend ждёт /api/...).
function normalizeBackendUrl(url) {
  return String(url || "https://dev3.constrtodo.ru:3005")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
}
const BACKEND_URL = normalizeBackendUrl(process.env.BASE_URL);
const DIST_DIR = path.join(__dirname, "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");

if (!fs.existsSync(INDEX_HTML)) {
  console.error(`[frontend] WARN: ${INDEX_HTML} не найден — фронт не собран?`);
}

const app = express();
app.set("trust proxy", "loopback"); // за host nginx

// Mount на /api срезает префикс — pathRewrite возвращает /api/... на бэкенд.
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: (path) => `/api${path}`,
    on: {
      error: (err, _req, res) => {
        console.error(`[proxy] error: ${err.message}`);
        if (res && !res.headersSent && res.status) {
          res.status(502).json({ error: "Proxy error", message: err.message });
        }
      },
    },
  }),
);

// Health-check для авто-отката в CI.
app.get("/__health", (_req, res) => res.json({ ok: true }));

// Статика: ассеты кэшируем надолго, index.html — никогда.
app.use(
  express.static(DIST_DIR, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// SPA-fallback (Express 5 синтаксис wildcard).
app.get("/{*splat}", (_req, res, next) => {
  if (!fs.existsSync(INDEX_HTML)) return next(new Error("index.html missing"));
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(INDEX_HTML);
});

const server = app.listen(PORT, () => {
  console.log(`[frontend] HTTP server: http://localhost:${PORT}`);
  console.log(`[frontend] API proxy:   /api -> ${BACKEND_URL}`);
});

const shutdown = (signal) => {
  console.log(`[frontend] ${signal} received, closing...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
