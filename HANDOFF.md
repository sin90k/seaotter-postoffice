# Sea Otter Post Office — 交接文档

> 供下一个 chat 快速接续开发使用。最后更新：2025-03-06

---

## 项目概述

**Sea Otter Post Office** 是 AI 驱动的艺术明信片生成应用。已完成从 Gemini AI Studio 到 **Supabase + Vercel** 的迁移，用户体系与积分已接入 Supabase。

---

## 已完成的工作

### 1. Supabase 集成
- 安装 `@supabase/supabase-js`，创建 `src/lib/supabaseClient.ts`
- Supabase URL：`https://nhddbpctroojcaywzmxy.supabase.co`（注意是 `bpct`，只有一个 c）
- 在 `App.tsx` 中实现邮箱注册/登录，调用 `supabase.auth.signUp` / `signInWithPassword`
- 登录后执行 `syncUserFromSupabase()`，从 `profiles` 读取或创建记录
- 登出时调用 `supabase.auth.signOut()`

### 2. 数据库与 profiles
- `supabase-setup.sql` 定义 `profiles` 表及 RLS 策略
- 触发器 `on_auth_user_created`：新用户注册时自动插入 `profiles`
- 已对现有用户执行 backfill SQL，补全 `profiles` 记录
- `profiles` 字段：`id`, `email`, `nickname`, `role`, `credits`, `generated_count`, `created_at`

### 3. 配置与部署
- Supabase 中关闭 Confirm email（**Sign In / Providers** → **Email**）
- Vercel 中配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- 本地 `.env` 包含上述变量（已在 `.gitignore` 中）

### 4. 已解决的问题
- `ERR_NAME_NOT_RESOLVED`：Supabase URL 拼写错误（多了一个 c）
- `400 Bad Request`：关闭 Confirm email 后解决
- `profiles` 为空：执行 `supabase-setup.sql` 中的表、RLS、触发器及 backfill 后解决

---

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/lib/supabaseClient.ts` | Supabase 客户端，导出 `supabase`、`isSupabaseConnected` |
| `src/App.tsx` | 登录/注册、`syncUserFromSupabase`、调试徽章 |
| `supabase-setup.sql` | profiles 表、RLS、触发器、backfill |
| `src/lib/storage.ts` | 本地存储（IndexedDB 等） |
| `.env` | 本地环境变量（不提交） |

---

## 环境变量

本地 `.env` 示例：

```
VITE_SUPABASE_URL=https://nhddbpctroojcaywzmxy.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

---

## 待办事项（按优先级）

1. ~~**postcards-supabase**~~：✅ 已完成。登录用户明信片存 Supabase，游客仍用 IndexedDB
2. ~~**credits-billing**~~：✅ 已完成。扣积分/购买时同步 Supabase profiles
3. ~~**auth-ux-validation**~~：✅ 已完成。邮箱/手机/密码校验，错误信息内联展示
4. ~~**events-logging**~~：✅ 已完成。sign_up/sign_in/sign_out/postcard_generated/credits_purchased/admin_panel_view
5. ~~**admin-panel-upgrade**~~：✅ 已完成。Admin 从 Supabase profiles 拉取用户数据

---

## 可选优化（已做）

- ~~调试徽章改为仅在 `?debug=1` 时显示~~ ✅
- ~~添加 `.env.example` 作为环境变量模板~~ ✅

---

## 邮件验证（可选）

若需开启「注册后需验证邮箱」：

1. **Supabase 控制台** → **Authentication** → **Providers** → **Email**
2. 开启 **Confirm email**；可选设置 **Secure email change**。
3. **URL Configuration**：在 **Site URL** 填生产地址（如 `https://xxx.vercel.app`）；在 **Redirect URLs** 中加入开发与生产地址（如 `http://localhost:5173/**`、`https://xxx.vercel.app/**`）。
4. 前端：注册成功后提示用户「请查收验证邮件并点击链接」；若使用邮件确认链接跳回站点，可在 `App.tsx` 或路由里用 `supabase.auth.getSession()` / `onAuthStateChange` 处理 hash 中的 `access_token` 等，完成验证后刷新用户状态。

当前项目默认关闭 Confirm email，注册后即可登录。

---

## 手机号验证（可选）

前端已支持「真实手机验证码登录」：当 Supabase 已配置且开启 Phone 登录时，用户输入手机号 → 点击获取验证码 → Supabase 通过短信服务商发送 OTP → 用户输入验证码 → `verifyOtp` 通过后登录。未配置时仍为演示模式（验证码 123456）。

**在 Supabase 中开启手机登录：**

1. **Authentication** → **Providers** → **Phone** 开启。
2. 配置短信服务商（任选其一）：
   - **Twilio**：在 Twilio 控制台创建账号，获取 Account SID、Auth Token，在 Supabase 的 Phone 设置里填入；需购买号码或使用 Messaging Service。
   - **MessageBird / Vonage / TextLocal**：按 Supabase 文档配置对应密钥。
3. 手机号格式：前端会自动将 138xxxx 转为 E.164（如 +86138...），默认国家码 +86。
4. 新手机用户首次验证通过后，Supabase 会创建 `auth.users` 记录；若已有 `on_auth_user_created` 触发器，会同步创建 `profiles`。`syncUserFromSupabase` 会从 `session.user.phone` 写入 `user.phoneNumber`。

未配置短信服务商时，手机登录仍为演示（验证码 123456），不影响邮箱与 Google 登录。

---

## 当前状态

- 邮箱注册、登录、登出正常；支持 Google OAuth、手机号 OTP 登录（Supabase 配置短信后生效，否则为演示 123456）
- `auth.users` 与 `profiles` 数据一致
- 新用户注册后会自动创建 profile 并显示昵称和积分
- 登录用户明信片存 Supabase（`postcards` 表），游客用 IndexedDB（`src/lib/storage.ts`）
- 登出二次确认、密码强度条、积分不足引导购买、游客登录后云端明信片 toast 已实现

---

## 本地运行

```bash
npm install
npm run dev
```

---

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS
- Supabase（Auth + PostgreSQL）
- Google Gemini API（GenAI）
- IndexedDB（idb-keyval，用于明信片历史）
