import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateQR } from "./qr";
import { CSP, HTML_INDEX, HTML_VIEW, HTML_HISTORY } from "./pages";

const app = new Hono<{
  Bindings: { DB: D1Database };
}>();

// CORS for API routes
app.use("/api/*", cors({
  origin: (origin) => origin,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// ─── Rate Limiting ────────────────────────────────────
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ─── API Routes ───────────────────────────────────────

app.get("/api/qr/:id", async (c) => {
  const id = c.req.param("id");
  const clip = await c.env.DB.prepare("SELECT id FROM clips WHERE id = ?").bind(id).first();
  if (!clip) return new Response("Not found", { status: 404 });
  const origin = c.req.url.replace(/\/api\/qr\/.*/, "");
  const png = generateQR(`${origin}/${id}`, 4);
  return new Response(png.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
});

app.post("/api/create", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) return c.json({ error: "Rate limit exceeded" }, 429);

  const body = await c.req.json<{ text: string; expiresIn: number; password?: string }>();
  if (!body.text || typeof body.text !== "string") return c.json({ error: "Text is required" }, 400);
  if (body.text.length > 100 * 1024) return c.json({ error: "Text exceeds 100KB limit" }, 400);
  const validExpirations = [3600, 86400, 604800, 2592000];
  if (!validExpirations.includes(body.expiresIn)) return c.json({ error: "Invalid expiration time" }, 400);

  const userId = c.req.header("x-user-id") || "anonymous";
  const now = Math.floor(Date.now() / 1000);

  let id: string;
  let retries = 0;
  while (retries < 3) {
    id = generateId();
    const existing = await c.env.DB.prepare("SELECT id FROM clips WHERE id = ?").bind(id).first();
    if (!existing) break;
    retries++;
  }
  if (retries >= 3) return c.json({ error: "Failed to generate unique ID" }, 500);

  // Increment total clips counter
  await c.env.DB.prepare("UPDATE stats SET value = value + 1 WHERE key = 'total_clips'").run();

  await c.env.DB.prepare(
    "INSERT INTO clips (id, text, password, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id!, body.text, body.password || null, userId, now, now + body.expiresIn).run();

  return c.json({ id: id!, url: `/${id!}` });
});

app.get("/api/stats", async (c) => {
  const row = await c.env.DB.prepare("SELECT value FROM stats WHERE key = 'total_clips'").first() as { value: number } | null;
  return c.json({ total: row?.value ?? 0 });
});

app.get("/api/get/:id", async (c) => {
  const id = c.req.param("id");
  const password = c.req.query("password") || null;
  const clip = await c.env.DB.prepare("SELECT * FROM clips WHERE id = ?").bind(id).first();
  if (!clip) return c.json({ error: "Clip not found" }, 404);
  const isExpired = (clip as any).expires_at < Math.floor(Date.now() / 1000);
  if ((clip as any).password && (clip as any).password !== password) {
    return c.json({ error: "Password required or incorrect", requirePassword: true }, 403);
  }
  return c.json({
    id: clip.id, text: (clip as any).text, created_at: (clip as any).created_at,
    expires_at: (clip as any).expires_at, expired: isExpired, hasPassword: !!(clip as any).password,
  });
});

app.get("/api/verify-password/:id", async (c) => {
  const id = c.req.param("id");
  const password = c.req.query("password");
  const clip = await c.env.DB.prepare("SELECT password FROM clips WHERE id = ?").bind(id).first();
  if (!clip) return c.json({ error: "Clip not found" }, 404);
  return c.json({ valid: (clip as any).password === password });
});

app.get("/api/history", async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "User ID required" }, 400);
  const page = parseInt(c.req.query("page") || "1");
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
  const offset = (page - 1) * limit;
  const now = Math.floor(Date.now() / 1000);

  const { results } = await c.env.DB.prepare(
    "SELECT id, text, created_at, expires_at FROM clips WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(userId, limit, offset).all();
  const total = await c.env.DB.prepare("SELECT COUNT(*) as count FROM clips WHERE user_id = ?").bind(userId).first() as { count: number };

  return c.json({
    items: (results || []).map((r: any) => ({
      id: r.id, text: r.text.length > 100 ? r.text.substring(0, 100) + "..." : r.text,
      created_at: r.created_at, expires_at: r.expires_at, expired: r.expires_at < now,
    })),
    page, limit, total: total.count, hasMore: page * limit < total.count,
  });
});

// ─── Page Routes ──────────────────────────────────────

function htmlResp(html: string): Response {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": CSP } });
}

app.get("/", () => htmlResp(HTML_INDEX));
app.get("/history", () => htmlResp(HTML_HISTORY));
app.get("/view/:id", (c) => htmlResp(HTML_VIEW.replace("__CLIP_ID__", c.req.param("id"))));
app.get("/:id", (c) => {
  const id = c.req.param("id");
  if (/^[a-zA-Z0-9]{4}$/.test(id)) return htmlResp(HTML_VIEW.replace("__CLIP_ID__", id));
  return c.notFound();
});

export default app;
