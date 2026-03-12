import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
