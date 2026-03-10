# 海獭邮局 (Sea Otter Post Office)

AI 驱动的艺术明信片生成器。

## 🚀 部署到 GitHub & CI/CD 设置

为了将此项目部署到 GitHub 并建立 CI/CD 链接，请按照以下步骤操作：

### 1. 创建 GitHub 仓库
1.  在您的 GitHub 账户上创建一个新的仓库。
2.  将此代码推送到该仓库：
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <您的仓库URL>
    git push -u origin main
    ```

### 2. 配置 GitHub Actions Secrets
为了让 CI/CD 流程能够正常工作（包括构建和测试），您需要在 GitHub 仓库中设置 API 密钥：
1.  进入您的 GitHub 仓库设置 (**Settings**)。
2.  在左侧菜单中选择 **Secrets and variables** -> **Actions**。
3.  点击 **New repository secret**。
4.  添加以下 Secret：
    *   `GEMINI_API_KEY`: 您的 Google Gemini API 密钥。

### 3. CI/CD 流程
项目已配置 GitHub Actions (`.github/workflows/deploy.yml`)。每当您向 `main` 分支推送代码时，它会自动执行：
*   安装依赖
*   代码检查 (Lint)
*   构建项目 (Build)

---

## 💎 用户体系与积分说明

根据您的要求，我们已经更新了积分发放逻辑：
1.  **未登录用户**：初始积分为 0。
2.  **注册/登录**：用户完成注册或首次社交登录后，系统将自动发放 **5 个初始积分**。
3.  **持久化**：用户信息和积分将保存在本地存储中（模拟真实数据库）。

## 📦 Supabase（可选）

若使用 Supabase 做登录与明信片存储，请在 Supabase 控制台 **SQL Editor** 中执行项目根目录的 **`supabase-setup.sql`**，以创建 `profiles`、`postcards`、`events` 表及 RLS。若未执行，注册后可能出现 404（表不存在）；当前版本会静默降级，不影响注册与登录。

**管理员入口**：登录后右上角头像 → 个人资料中需显示「Admin Panel」按钮。方式一：在 `.env` 中设置 `VITE_ADMIN_EMAIL=你的登录邮箱` 后重新构建部署。方式二：在 Supabase **SQL Editor** 执行 `UPDATE profiles SET role = 'admin' WHERE email = '你的登录邮箱';`，然后刷新页面。

## 🛠 技术栈
*   React + Vite + TypeScript
*   Tailwind CSS
*   Google Gemini API (GenAI)
*   Lucide React (图标)
*   Motion (动画)
