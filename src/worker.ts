import { Hono } from "hono";
import { apiApp } from "./routes/api";
import { pagesApp } from "./routes/pages";

const app = new Hono<{
  Bindings: { DB: D1Database };
}>();

// Mount API routes under /api
app.route("/api", apiApp);

// Mount page routes (handles /, /:id, /history, /view/:id)
app.route("/", pagesApp);

export default app;
