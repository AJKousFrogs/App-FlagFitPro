import { AngularNodeAppEngine } from "@angular/ssr/node";
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
app.get("*", async (req, res, next) => {
  try {
    const response = await angularApp.handle(req);
    if (response) {
      // Set status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Stream the response body
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});

const port = process.env["PORT"] || 4000;
const _server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Node Express server listening on http://localhost:${port}`);
});

export default app;
