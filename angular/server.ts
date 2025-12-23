import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
} from "@angular/ssr";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, "../browser");

const app = express();

// Serve static files from /browser
app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: false,
  }),
);

// Create Angular SSR engine
const angularApp = new AngularNodeAppEngine();

// All regular routes use the Angular engine
app.get("*", createNodeRequestHandler(angularApp, browserDistFolder));

const port = process.env["PORT"] || 4000;
const server = app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});

export default app;
