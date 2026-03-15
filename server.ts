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
      const rpc = await supabaseAdmin!.rpc("cleanup_expired_postcards", { p_limit: limit });
      if (rpc.error) return res.status(500).json({ error: rpc.error.message || "cleanup rpc failed" });
      res.json({ ok: true, cleaned: typeof rpc.data === "number" ? rpc.data : 0 });
    } catch (e: any) {
      console.error("[server] cron cleanup error", e);
      res.status(500).json({ error: e?.message || "cleanup failed" });
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
