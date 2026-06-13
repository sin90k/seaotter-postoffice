# 海獭邮局 (Sea Otter Post Office)

AI 驱动的艺术明信片生成器。

## 本地启动

```bash
npm ci
cp .env.example .env
npm run dev
```

开发服务默认运行在：

```text
http://localhost:3000
```

## 环境变量

浏览器端 Supabase：

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

服务端 Supabase API：

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

AI 生成能力：

```env
VITE_OPENAI_API_KEY=
VITE_OPENAI_BASE_URL=
VITE_GEMINI_API_KEY=
```

管理员入口：

```env
VITE_ADMIN_EMAIL=
```

## 用户体系与积分

1. **未登录用户**：初始积分为 0。
2. **注册/首次登录**：用户完成注册或首次社交登录后，系统默认发放 **5 个初始积分**。
3. **持久化**：登录用户信息、积分和明信片历史保存到 Supabase；未登录用户使用浏览器本地存储。

## Supabase 设置

如果使用 Supabase 做登录、明信片存储、积分、后台和埋点，请在 Supabase 控制台 **SQL Editor** 中执行项目根目录的 `supabase-setup.sql`。

它会创建并配置：

- `profiles`
- `postcards`
- `events`
- `credits_ledger`
- `payments`
- `payment_config`
- RLS policies
- 新用户注册触发器

Storage 还需要在 Supabase Dashboard 中创建这些 bucket：

- `postcards`
- `sharecards`
- `payment-qr`

管理员入口：登录后右上角头像 -> 个人资料中显示 `Admin Panel` 按钮。可以在 `.env` 中设置 `VITE_ADMIN_EMAIL=你的登录邮箱` 后重新构建部署；也可以在 Supabase SQL Editor 执行：

```sql
UPDATE profiles SET role = 'admin' WHERE email = '你的登录邮箱';
```

## 部署到 Vercel

1. 将仓库导入 Vercel。
2. 在 Vercel Project Settings -> Environment Variables 中填写 `.env.example` 中需要的变量。
3. 在 Supabase SQL Editor 执行 `supabase-setup.sql`。
4. 在 Supabase Storage 创建所需 bucket。
5. 重新部署 Vercel 项目。

当前仓库没有检测到 `.github/workflows/deploy.yml`。如果需要 GitHub Actions，请新增 CI workflow，至少运行 `npm ci`、`npm run lint`、`npm run build`。

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS
- Express + tsx
- Supabase Auth / Database / Storage
- Google Gemini API / OpenAI-compatible API
- Lucide React
- Motion
