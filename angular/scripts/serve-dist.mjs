import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const DIST_CANDIDATES = [
  resolve(process.cwd(), "dist/flagfit-pro/browser"),
  resolve(process.cwd(), "dist/flagfit-pro"),
];
const DIST_ROOT =
  DIST_CANDIDATES.find((candidate) => existsSync(candidate)) ??
  DIST_CANDIDATES[0];
const PORT = Number(process.env["PORT"] || "4200");
const HOST = process.env["HOST"] || "127.0.0.1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function getFilePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const requested = resolve(DIST_ROOT, `.${safePath}`);
  if (!requested.startsWith(DIST_ROOT)) {
    return null;
  }
  if (existsSync(requested) && statSync(requested).isFile()) {
    return requested;
  }
  return join(DIST_ROOT, "index.html");
}

if (!existsSync(DIST_ROOT)) {
  console.error(`[serve-dist] Build output not found at ${DIST_ROOT}`);
  process.exit(1);
}

const server = createServer((req, res) => {
  const filePath = getFilePath(req.url || "/");
  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[serve-dist] Serving ${DIST_ROOT} at http://${HOST}:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
