import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.REBRICKABLE_API_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));

const allowedTypes = new Set(["sets", "minifigs", "parts"]);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, rebrickableConfigured: Boolean(API_KEY) });
});

app.get("/api/search", async (req, res) => {
  const query = String(req.query.q || "").trim().slice(0, 80);
  const type = String(req.query.type || "sets").toLowerCase();
  const pageSize = Math.min(Math.max(Number(req.query.page_size) || 20, 1), 50);

  if (!query) return res.status(400).json({ error: "Enter a search term." });
  if (!allowedTypes.has(type)) return res.status(400).json({ error: "Choose sets, minifigs, or parts." });
  if (!API_KEY) return res.status(503).json({
    error: "Rebrickable is not connected yet. Add your newly rotated key to the server .env file.",
    setupRequired: true
  });

  // Rebrickable requires the API key in the Authorization header.
  // The key stays on this server and is never sent to the browser.
  const endpoint = `https://rebrickable.com/api/v3/lego/${type}/`;
  const url = new URL(endpoint);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", String(pageSize));

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `key ${API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000)
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : upstream.status === 401 ? 502 : 502;
      return res.status(status).json({
        error: upstream.status === 429
          ? "Rebrickable rate limit reached. Please wait a moment and try again."
          : upstream.status === 401
          ? "Rebrickable rejected the server key. Check that your rotated API key is correct."
          : `Rebrickable request failed (${upstream.status}).`,
        upstreamStatus: upstream.status
      });
    }
    res.set("Cache-Control", "public, max-age=60");
    res.json({
      count: payload.count ?? (payload.results || []).length,
      results: (payload.results || []).map(item => ({
        id: item.set_num || item.fig_num || item.part_num || item.id,
        name: item.name,
        year: item.year,
        numParts: item.num_parts,
        image: item.set_img_url || item.fig_img_url || item.part_img_url || null,
        url: item.set_url || item.fig_url || item.part_url || null,
        category: type
      }))
    });
  } catch (error) {
    res.status(504).json({ error: error.name === "TimeoutError" ? "Rebrickable took too long to respond. Try again." : "Could not reach Rebrickable. Check the server connection." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`GPBrickSearch running at http://localhost:${PORT}`));
