import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
