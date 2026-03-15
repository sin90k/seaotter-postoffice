import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const canUseServiceSupabase = !!(supabaseUrl && serviceRoleKey);
  const supabaseAdmin = canUseServiceSupabase ? createClient(supabaseUrl, serviceRoleKey) : null;

  const requireService = (res: express.Response) => {
    if (!supabaseAdmin) {
      res.status(500).json({ error: "Supabase service role is not configured." });
      return false;
    }
    return true;
  };

  const parseDataUrl = (dataUrl: string): { mime: string; buffer: Buffer } | null => {
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
    if (!match) return null;
    const extRaw = match[1] || "jpeg";
    const mime = extRaw === "jpg" ? "image/jpeg" : `image/${extRaw}`;
    return { mime, buffer: Buffer.from(match[2], "base64") };
  };

  const extFromMime = (mime: string) => {
    if (mime.includes("png")) return "png";
    if (mime.includes("webp")) return "webp";
    return "jpg";
  };

  const inferExpiresAt = async (createdAt: string | null, userId: string): Promise<string | null> => {
    if (!supabaseAdmin) return null;
    const [{ data: cfg }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("payment_config").select("free_retention_days, vip_retention_days").eq("id", 1).single(),
      supabaseAdmin.from("profiles").select("role").eq("id", userId).single(),
    ]);
    const freeDays = typeof cfg?.free_retention_days === "number" && cfg.free_retention_days > 0 ? cfg.free_retention_days : 7;
    const vipDays = typeof cfg?.vip_retention_days === "number" && cfg.vip_retention_days >= 0 ? cfg.vip_retention_days : 0;
    const createdMs = createdAt ? new Date(createdAt).getTime() : Date.now();
    const role = String(profile?.role || "user");
    if (role === "vip") {
      if (vipDays === 0) return null;
      return new Date(createdMs + vipDays * 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(createdMs + freeDays * 24 * 60 * 60 * 1000).toISOString();
  };

  const requireAdminByBearer = async (req: express.Request, res: express.Response): Promise<{ userId: string } | null> => {
    if (!requireService(res)) return null;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return null;
    }

    const userRes = await supabaseAdmin!.auth.getUser(token);
    const uid = userRes.data.user?.id;
    if (!uid) {
      res.status(401).json({ error: "Invalid user token" });
      return null;
    }
    const roleRes = await supabaseAdmin!.from("profiles").select("role").eq("id", uid).single();
    const role = String(roleRes.data?.role || "user");
    if (!(role === "admin" || role === "support")) {
      res.status(403).json({ error: "permission denied" });
      return null;
    }
    return { userId: uid };
  };

  const requireUserByBearer = async (req: express.Request, res: express.Response): Promise<{ userId: string } | null> => {
    if (!requireService(res)) return null;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing bearer token" });
      return null;
    }
    const userRes = await supabaseAdmin!.auth.getUser(token);
    const uid = userRes.data.user?.id;
    if (!uid) {
      res.status(401).json({ error: "Invalid user token" });
      return null;
    }
    return { userId: uid };
  };

  const detectCountryCode = (req: express.Request): string => {
    const fromQuery = String((req.query as { country?: string } | undefined)?.country || "").trim();
    const fromHeader = String(req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "").trim();
    const candidate = (fromQuery || fromHeader || "CN").toUpperCase();
    if (/^[A-Z]{2}$/.test(candidate)) return candidate;
    return "CN";
  };

  const mapToCountryConfigCode = (iso2: string): string => {
    if (iso2 === "GB") return "UK";
    return iso2;
  };

  const getMarketWithPricing = async (countryCode: string) => {
    const marketCode = mapToCountryConfigCode(countryCode);
    const marketRes = await supabaseAdmin!
      .from("market_config")
      .select("country_code, country_name, language_code, currency, region_tier, is_active")
      .eq("country_code", marketCode)
      .eq("is_active", true)
      .maybeSingle();
    const market = marketRes.data || {
      country_code: "CN",
      country_name: "China",
      language_code: "zh",
      currency: "CNY",
      region_tier: "tier1",
      is_active: true,
    };
    const pricingRes = await supabaseAdmin!
      .from("pricing_plans")
      .select("market_code, currency, price_per_postcard, credits_per_pack, pack_price, packs")
      .eq("market_code", String((market as any).country_code || "CN"))
      .maybeSingle();
    return {
      market,
      pricing: pricingRes.data || null,
    };
  };

  app.use(express.json({ limit: "10mb" }));

  // 静态上传目录（仅本地有效；Vercel 无持久磁盘，收款码改由接口返回 dataUrl）
  const uploadsRoot = path.join(__dirname, "uploads");
  const paymentDir = path.join(uploadsRoot, "payments");
  if (process.env.VERCEL !== "1") {
    fs.mkdirSync(paymentDir, { recursive: true });
    app.use("/uploads", express.static(uploadsRoot));
  }

  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Save share card image and record
  app.post("/api/share-card/save", async (req, res) => {
    try {
      const user = await requireUserByBearer(req, res);
      if (!user) return;
      const shareType = String((req as any).body?.shareType || "");
      const dataUrl = String((req as any).body?.dataUrl || "");
      const postcardLocalId = String((req as any).body?.postcardLocalId || "");
      if (!(shareType === "front_only" || shareType === "front_back")) {
        return res.status(400).json({ error: "invalid shareType" });
      }
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) return res.status(400).json({ error: "invalid dataUrl" });
      const ext = extFromMime(parsed.mime);
      const objectPath = `${user.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabaseAdmin!.storage.from("sharecards").upload(objectPath, parsed.buffer, {
        upsert: false,
        contentType: parsed.mime,
      });
      if (up.error) return res.status(500).json({ error: up.error.message || "upload failed" });

      let postcardId: string | null = null;
      if (postcardLocalId) {
        // Some PostgREST deployments are strict on json path filters; resolve in app side for compatibility.
        const match = await supabaseAdmin!
          .from("postcards")
          .select("id,payload")
          .eq("user_id", user.userId)
          .order("created_at", { ascending: false })
          .limit(200);
        if (!match.error && Array.isArray(match.data)) {
          const hit = match.data.find((r: any) => String(r?.payload?.id || "") === postcardLocalId);
          postcardId = hit?.id || null;
        }
      }
      const signed = await supabaseAdmin!.storage.from("sharecards").createSignedUrl(objectPath, 60 * 60 * 24 * 365);
      const imageUrl = signed.data?.signedUrl || objectPath;
      const ins = await supabaseAdmin!
        .from("postcard_share_images")
        .insert({
          postcard_id: postcardId,
          postcard_local_id: postcardLocalId || null,
          user_id: user.userId,
          share_type: shareType,
          image_url: imageUrl,
        })
        .select("id,image_url,created_at")
        .maybeSingle();
      if (ins.error) return res.status(500).json({ error: ins.error.message || "save record failed" });
      res.json({ ok: true, share: ins.data });
    } catch (e: any) {
      console.error("[server] save share-card error", e);
      res.status(500).json({ error: e?.message || "save share-card failed" });
    }
  });

  // Current user travel map data
  app.get("/api/travel-map/me", async (req, res) => {
    try {
      const user = await requireUserByBearer(req, res);
      if (!user) return;
      const [statsRes, metaRes] = await Promise.all([
        supabaseAdmin!
          .from("user_travel_stats")
          .select("countries_count,cities_count,postcards_count,updated_at")
          .eq("user_id", user.userId)
          .maybeSingle(),
        supabaseAdmin!
          .from("postcard_metadata")
          .select("city,country,latitude,longitude,theme_slug,postcard_local_id")
          .eq("user_id", user.userId)
          .order("updated_at", { ascending: false })
          .limit(2000),
      ]);
      const markers = Array.isArray(metaRes.data)
        ? metaRes.data
            .filter((m: any) => m && (m.city || m.country) && typeof m.latitude === "number" && typeof m.longitude === "number")
            .map((m: any) => ({
              city: m.city || "",
              country: m.country || "",
              latitude: m.latitude,
              longitude: m.longitude,
              themeSlug: m.theme_slug || null,
              postcardLocalId: m.postcard_local_id || null,
            }))
        : [];
      res.json({
        ok: true,
        stats: statsRes.data || { countries_count: 0, cities_count: 0, postcards_count: 0, updated_at: null },
        markers,
      });
    } catch (e: any) {
      console.error("[server] travel-map me error", e);
      res.status(500).json({ error: e?.message || "travel-map query failed" });
    }
  });

  // Current user postcards for a specific city/country marker
  app.get("/api/travel-map/city-postcards", async (req, res) => {
    try {
      const user = await requireUserByBearer(req, res);
      if (!user) return;
      const city = String((req as any).query?.city || "").trim();
      const country = String((req as any).query?.country || "").trim();
      if (!city && !country) {
        return res.status(400).json({ error: "city or country is required" });
      }

      let metaQuery = supabaseAdmin!
        .from("postcard_metadata")
        .select("postcard_id,postcard_local_id,city,country,theme_slug,updated_at")
        .eq("user_id", user.userId)
        .order("updated_at", { ascending: false })
        .limit(120);
      if (city) metaQuery = metaQuery.eq("city", city);
      if (country) metaQuery = metaQuery.eq("country", country);
      const metaRes = await metaQuery;
      if (metaRes.error) return res.status(500).json({ error: metaRes.error.message || "metadata query failed" });

      const ids = (metaRes.data || []).map((m: any) => m.postcard_id).filter(Boolean);
      if (ids.length === 0) return res.json({ ok: true, items: [] });

      const cards = await supabaseAdmin!
        .from("postcards")
        .select("id,payload,created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (cards.error) return res.status(500).json({ error: cards.error.message || "postcards query failed" });

      const payloadById = new Map<string, any>();
      for (const c of cards.data || []) payloadById.set(String((c as any).id), (c as any).payload || {});

      const items = (metaRes.data || []).map((m: any) => {
        const p = payloadById.get(String(m.postcard_id)) || {};
        return {
          postcardId: m.postcard_id,
          postcardLocalId: m.postcard_local_id || p.id || null,
          title: p.draftTitle || p.title || "Postcard",
          frontUrl: p.frontDataUrl || p.frontUrl || "",
          city: m.city || "",
          country: m.country || "",
          themeSlug: m.theme_slug || null,
          createdAt: p.createdAt || null,
        };
      });
      res.json({ ok: true, items });
    } catch (e: any) {
      console.error("[server] travel-map city-postcards error", e);
      res.status(500).json({ error: e?.message || "city postcards query failed" });
    }
  });

  // Market detection + pricing bundle (IP headers + optional ?country=XX override)
  app.get("/api/market/detect", async (req, res) => {
    try {
      if (!requireService(res)) return;
      const country = detectCountryCode(req);
      const data = await getMarketWithPricing(country);
      res.json({ ok: true, detectedCountry: country, ...data });
    } catch (e: any) {
      console.error("[server] market detect error", e);
      res.status(500).json({ error: e?.message || "market detect failed" });
    }
  });

  // Public read: active markets
  app.get("/api/market/config", async (_req, res) => {
    try {
      if (!requireService(res)) return;
      const q = await supabaseAdmin!
        .from("market_config")
        .select("id, country_code, country_name, language_code, currency, region_tier, is_active, created_at")
        .order("country_code", { ascending: true });
      if (q.error) return res.status(500).json({ error: q.error.message || "market query failed" });
      res.json({ ok: true, items: q.data || [] });
    } catch (e: any) {
      console.error("[server] market config error", e);
      res.status(500).json({ error: e?.message || "market config failed" });
    }
  });

  // Public read: pricing plans
  app.get("/api/pricing/plans", async (_req, res) => {
    try {
      if (!requireService(res)) return;
      const q = await supabaseAdmin!
        .from("pricing_plans")
        .select("id, market_code, currency, price_per_postcard, credits_per_pack, pack_price, packs, created_at")
        .order("market_code", { ascending: true });
      if (q.error) return res.status(500).json({ error: q.error.message || "pricing query failed" });
      res.json({ ok: true, items: q.data || [] });
    } catch (e: any) {
      console.error("[server] pricing plans error", e);
      res.status(500).json({ error: e?.message || "pricing plans failed" });
    }
  });

  // Admin write: markets
  app.post("/api/admin/market/upsert", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const body = (req as any).body || {};
      const row = {
        country_code: String(body.country_code || "").toUpperCase(),
        country_name: String(body.country_name || ""),
        language_code: String(body.language_code || "en"),
        currency: String(body.currency || "USD"),
        region_tier: String(body.region_tier || "tier1"),
        is_active: body.is_active !== false,
      };
      if (!/^[A-Z]{2}$/.test(row.country_code)) return res.status(400).json({ error: "invalid country_code" });
      const up = await supabaseAdmin!.from("market_config").upsert(row, { onConflict: "country_code" }).select("*").single();
      if (up.error) return res.status(500).json({ error: up.error.message || "market upsert failed" });
      res.json({ ok: true, item: up.data, requestedBy: admin.userId });
    } catch (e: any) {
      console.error("[server] admin market upsert error", e);
      res.status(500).json({ error: e?.message || "market upsert failed" });
    }
  });

  // Admin write: pricing
  app.post("/api/admin/pricing/upsert", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const body = (req as any).body || {};
      const row = {
        market_code: String(body.market_code || "").toUpperCase(),
        currency: String(body.currency || "USD"),
        price_per_postcard: Number(body.price_per_postcard || 0),
        credits_per_pack: Math.max(1, Number(body.credits_per_pack || 10)),
        pack_price: String(body.pack_price || "0"),
        packs: Array.isArray(body.packs) ? body.packs : [],
      };
      if (!row.market_code || row.price_per_postcard <= 0) {
        return res.status(400).json({ error: "invalid market_code or price_per_postcard" });
      }
      const up = await supabaseAdmin!.from("pricing_plans").upsert(row, { onConflict: "market_code" }).select("*").single();
      if (up.error) return res.status(500).json({ error: up.error.message || "pricing upsert failed" });
      res.json({ ok: true, item: up.data, requestedBy: admin.userId });
    } catch (e: any) {
      console.error("[server] admin pricing upsert error", e);
      res.status(500).json({ error: e?.message || "pricing upsert failed" });
    }
  });

  // Admin write: share branding
  app.post("/api/admin/share-branding", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const body = (req as any).body || {};
      const payload = {
        branding_enabled: body.branding_enabled !== false,
        branding_text: String(body.branding_text || "seaotterpost.com").trim() || "seaotterpost.com",
        branding_opacity: Math.max(0, Math.min(1, Number(body.branding_opacity ?? 0.7))),
        branding_size: Math.max(0.005, Math.min(0.1, Number(body.branding_size ?? 0.02))),
        updated_at: new Date().toISOString(),
      };
      const current = await supabaseAdmin!.from("share_branding").select("id").limit(1).maybeSingle();
      if (current.error) return res.status(500).json({ error: current.error.message || "share branding query failed" });
      const id = (current.data as { id?: string } | null)?.id;
      const up = id
        ? await supabaseAdmin!.from("share_branding").update(payload).eq("id", id).select("*").single()
        : await supabaseAdmin!.from("share_branding").insert(payload).select("*").single();
      if (up.error) return res.status(500).json({ error: up.error.message || "share branding save failed" });
      res.json({ ok: true, item: up.data, requestedBy: admin.userId });
    } catch (e: any) {
      console.error("[server] admin share branding error", e);
      res.status(500).json({ error: e?.message || "share branding failed" });
    }
  });

  // Admin storage backfill endpoint: migrate legacy payload(base64) to Supabase Storage
  app.post("/api/admin/storage/backfill", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const limit = Math.max(1, Math.min(500, Number((req as any).body?.limit) || 100));

      const { data: rows, error } = await supabaseAdmin!
        .from("postcards")
        .select("id, user_id, payload, front_path, back_path, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        return res.status(500).json({ error: error.message || "query failed" });
      }

      let scanned = 0;
      let migrated = 0;
      let failed = 0;

      for (const row of rows || []) {
        scanned += 1;
        const payload = (row as any).payload || {};
        const userId = String((row as any).user_id || "");
        const postcardId = String((row as any).id || "");
        if (!userId || !postcardId) continue;

        let frontPath = (row as any).front_path as string | null;
        let backPath = (row as any).back_path as string | null;
        let changed = false;

        if (!frontPath && typeof payload.frontDataUrl === "string") {
          const parsed = parseDataUrl(payload.frontDataUrl);
          if (parsed) {
            const ext = extFromMime(parsed.mime);
            const targetPath = `${userId}/${postcardId}/front.${ext}`;
            const upRes = await supabaseAdmin!.storage
              .from("postcards")
              .upload(targetPath, parsed.buffer, { upsert: true, contentType: parsed.mime });
            if (!upRes.error) {
              frontPath = targetPath;
              changed = true;
            } else {
              failed += 1;
            }
          }
        }

        if (!backPath && typeof payload.backDataUrl === "string") {
          const parsed = parseDataUrl(payload.backDataUrl);
          if (parsed) {
            const ext = extFromMime(parsed.mime);
            const targetPath = `${userId}/${postcardId}/back.${ext}`;
            const upRes = await supabaseAdmin!.storage
              .from("postcards")
              .upload(targetPath, parsed.buffer, { upsert: true, contentType: parsed.mime });
            if (!upRes.error) {
              backPath = targetPath;
              changed = true;
            } else {
              failed += 1;
            }
          }
        }

        if (changed) {
          const expiresAt = await inferExpiresAt((row as any).created_at || null, userId);
          const up = await supabaseAdmin!
            .from("postcards")
            .update({
              front_path: frontPath,
              back_path: backPath,
              expires_at: expiresAt,
            })
            .eq("id", postcardId);
          if (up.error) {
            failed += 1;
          } else {
            migrated += 1;
          }
        }
      }

      return res.json({
        ok: true,
        requestedBy: admin.userId,
        scanned,
        migrated,
        failed,
      });
    } catch (e: any) {
      console.error("[server] backfill error", e);
      res.status(500).json({ error: e?.message || "backfill failed" });
    }
  });

  // 执行过期清理：RPC 只删 postcards 并返回 path 列表，再由本机用 Storage API 删文件（避免 SQL 直接删 storage.objects）
  const runStorageCleanup = async (pLimit: number): Promise<{ cleaned: number; pathsDeleted: number }> => {
    const rpc = await supabaseAdmin!.rpc("cleanup_expired_postcards", { p_limit: pLimit });
    if (rpc.error) throw new Error(rpc.error.message || "cleanup rpc failed");
    const paths = Array.isArray(rpc.data) ? (rpc.data as string[]) : [];
    const validPaths = paths.filter((p) => typeof p === "string" && p.trim().length > 0);
    let pathsDeleted = 0;
    if (validPaths.length > 0) {
      const chunk = 100;
      for (let i = 0; i < validPaths.length; i += chunk) {
        const batch = validPaths.slice(i, i + chunk);
        const { error } = await supabaseAdmin!.storage.from("postcards").remove(batch);
        if (!error) pathsDeleted += batch.length;
        else console.warn("[server] storage remove batch error", error.message);
      }
    }
    return { cleaned: validPaths.length, pathsDeleted };
  };

  // Cron cleanup endpoint (Vercel cron header or explicit secret)
  app.all("/api/cron/storage-cleanup", async (req, res) => {
    try {
      if (!requireService(res)) return;
      const hasCronHeader = req.headers["x-vercel-cron"] === "1";
      const expected = process.env.CRON_SECRET || "";
      const provided = (req.headers["x-cron-secret"] as string) || String((req as any).query?.secret || "");
      if (!hasCronHeader && (!expected || provided !== expected)) {
        return res.status(401).json({ error: "unauthorized cron request" });
      }
      const limit = Math.max(1, Math.min(2000, Number((req as any).body?.limit) || 500));
      const result = await runStorageCleanup(limit);
      res.json({ ok: true, cleaned: result.cleaned, pathsDeleted: result.pathsDeleted });
    } catch (e: any) {
      console.error("[server] cron cleanup error", e);
      res.status(500).json({ error: e?.message || "cleanup failed" });
    }
  });

  // Cron: refresh user travel stats
  app.all("/api/cron/travel-stats-refresh", async (req, res) => {
    try {
      if (!requireService(res)) return;
      const hasCronHeader = req.headers["x-vercel-cron"] === "1";
      const expected = process.env.CRON_SECRET || "";
      const provided = (req.headers["x-cron-secret"] as string) || String((req as any).query?.secret || "");
      if (!hasCronHeader && (!expected || provided !== expected)) {
        return res.status(401).json({ error: "unauthorized cron request" });
      }
      const limit = Math.max(1, Math.min(20000, Number((req as any).body?.limit) || 5000));
      const rpc = await supabaseAdmin!.rpc("refresh_user_travel_stats", { p_limit: limit });
      if (rpc.error) return res.status(500).json({ error: rpc.error.message || "refresh_user_travel_stats failed" });
      res.json({ ok: true, updatedUsers: Number(rpc.data || 0) });
    } catch (e: any) {
      console.error("[server] cron travel stats error", e);
      res.status(500).json({ error: e?.message || "travel stats refresh failed" });
    }
  });

  // Admin manual trigger: travel stats refresh
  app.post("/api/admin/travel-stats/refresh", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const limit = Math.max(1, Math.min(20000, Number((req as any).body?.limit) || 5000));
      const rpc = await supabaseAdmin!.rpc("refresh_user_travel_stats", { p_limit: limit });
      if (rpc.error) return res.status(500).json({ error: rpc.error.message || "refresh_user_travel_stats failed" });
      res.json({ ok: true, updatedUsers: Number(rpc.data || 0), requestedBy: admin.userId });
    } catch (e: any) {
      console.error("[server] admin travel stats refresh error", e);
      res.status(500).json({ error: e?.message || "travel stats refresh failed" });
    }
  });

  // Admin 立即清理：与 cron 相同逻辑，需 Bearer 管理员
  app.post("/api/admin/storage/cleanup-expired", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const limit = Math.max(1, Math.min(2000, Number((req as any).body?.limit) || 500));
      const result = await runStorageCleanup(limit);
      res.json({ ok: true, cleaned: result.cleaned, pathsDeleted: result.pathsDeleted });
    } catch (e: any) {
      console.error("[server] admin cleanup-expired error", e);
      res.status(500).json({ error: e?.message || "cleanup failed" });
    }
  });

  app.post("/api/cron/travel-stats-refresh", async (req, res) => {
    try {
      if (!requireService(res)) return;
      const hasCronHeader = req.headers["x-vercel-cron"] === "1";
      const expected = process.env.CRON_SECRET || "";
      const provided = (req.headers["x-cron-secret"] as string) || String((req as any).query?.secret || "");
      if (!hasCronHeader && (!expected || provided !== expected)) {
        return res.status(401).json({ error: "unauthorized cron request" });
      }
      const limit = Math.max(1, Math.min(100000, Number((req as any).body?.limit) || 5000));
      const rpc = await supabaseAdmin!.rpc("refresh_user_travel_stats", { p_limit: limit });
      if (rpc.error) return res.status(500).json({ error: rpc.error.message || "refresh travel stats rpc failed" });
      res.json({ ok: true, refreshedUsers: typeof rpc.data === "number" ? rpc.data : 0 });
    } catch (e: any) {
      console.error("[server] cron travel-stats-refresh error", e);
      res.status(500).json({ error: e?.message || "travel stats refresh failed" });
    }
  });

  app.post("/api/admin/travel-stats-refresh", async (req, res) => {
    try {
      const admin = await requireAdminByBearer(req, res);
      if (!admin) return;
      const limit = Math.max(1, Math.min(100000, Number((req as any).body?.limit) || 5000));
      const rpc = await supabaseAdmin!.rpc("refresh_user_travel_stats", { p_limit: limit });
      if (rpc.error) return res.status(500).json({ error: rpc.error.message || "refresh travel stats rpc failed" });
      res.json({ ok: true, refreshedUsers: typeof rpc.data === "number" ? rpc.data : 0 });
    } catch (e: any) {
      console.error("[server] admin travel-stats-refresh error", e);
      res.status(500).json({ error: e?.message || "travel stats refresh failed" });
    }
  });

  // Mock OAuth URL endpoint
  app.get("/api/auth/url", (req, res) => {
    const provider = req.query.provider as string;
    // In a real app, you'd construct the URL for the provider (Google, GitHub, etc.)
    // For this demo, we'll simulate it by redirecting to our own callback with a mock code
    const mockAuthUrl = `/auth/callback?code=mock_code_${provider}&provider=${provider}`;
    res.json({ url: mockAuthUrl });
  });

  // 支付二维码上传接口（接收前端 base64）。Vercel 无持久磁盘，直接返回 dataUrl 由前端存 localStorage；本地则写入 uploads/payments。
  app.post("/api/admin/payment-qr", async (req, res) => {
    try {
      const { provider, dataUrl } = (req as any).body || {};
      if (!provider || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "provider 和 dataUrl 为必填" });
      }
      const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
      if (!match) {
        return res.status(400).json({ error: "dataUrl 必须是 data:image/...;base64, 格式" });
      }
      const isVercel = process.env.VERCEL === "1";
      if (isVercel) {
        // Vercel serverless 无法持久写文件，直接返回 dataUrl，由前端存入 localStorage
        return res.json({ url: dataUrl });
      }
      const extRaw = match[1];
      const ext = extRaw === "jpeg" ? "jpg" : extRaw === "jpg" ? "jpg" : extRaw;
      const buffer = Buffer.from(match[2], "base64");
      const safeProvider = String(provider).toLowerCase().includes("alipay") ? "alipay" : "wechat";
      const filename = `${safeProvider}-${Date.now()}.${ext}`;
      const filepath = path.join(paymentDir, filename);
      await fs.promises.writeFile(filepath, buffer);
      res.json({ url: `/uploads/payments/${filename}` });
    } catch (e: any) {
      console.error("[server] upload payment qr error", e);
      res.status(500).json({ error: "上传失败" });
    }
  });

  // OAuth Callback Handler
  app.get("/auth/callback", (req, res) => {
    const { provider } = req.query;
    const p = typeof provider === 'string' ? provider : (Array.isArray(provider) ? provider[0] : 'social');
    const prov = typeof p === 'string' ? p : 'social';
    const name = prov ? prov.charAt(0).toUpperCase() + prov.slice(1) : 'Social';
    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                email: 'user@${prov || 'social'}.com',
                name: '${name} User'
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
