# 管理后台 MVP 说明

## 一、已实现页面（4+1）

1. **Dashboard**：今日指标（今日生成数、今日新用户、今日赠送/付费积分消耗）、总用户/总生成/流通积分/VIP 数、近 7 天用户增长图、用户分布饼图。
2. **Users**：用户列表（ID、注册时间、邮箱、当前赠送/付费积分、已生成数）、用户详情（积分流水、最近明信片）、管理员操作：修改积分、封禁、重置额度。
3. **Credits Ledger**：积分流水列表（时间、用户、类型、来源、数量）、管理员「手动补偿」。
4. **Postcards**：明信片记录列表（时间、用户、预览图、标题、状态）、点击查看详情（正反面图、标题、地点、用户）。
5. **System Config**：OpenAI / Gemini API 配置（与原有一致）。

## 二、权限

- **admin**：可读可写（改积分、封禁、重置、手动补偿、读全部用户/流水/明信片）。
- **support**：只读（可看 Dashboard、Users、Credits Ledger、Postcards，不能改积分或封禁）。

`profiles.role` 支持：`admin` | `user` | `support` | `banned`。

## 三、数据库

- 在 **Supabase SQL Editor** 中执行 **整份** `supabase-setup.sql`（包含 `credits_ledger` 表及 RLS、support 策略）。
- 若已跑过旧版 setup，只需补跑 **从「credits_ledger 积分流水」到文件末尾** 的那一段（建表 + 策略 + support/Admin 读 postcards）。

## 四、积分追溯

- 用户每次生成明信片会写入 `credits_ledger`（`source='postcard'`，`amount` 为负）。
- 管理员在 Users 里改积分或 Ledger 里「手动补偿」会写入 `credits_ledger`（`source='admin_adjust'`）。
- `profileSync.syncCreditsToSupabase` 会同步 `promo_credits`、`paid_credits`、`credits`、`generated_count`；`recordPostcardConsumption` 负责写入消耗流水。

## 五、后续可扩展

- Content Moderation：举报列表 + 删除明信片/封禁/忽略（需 `reports` 表与接口）。
- Activities/Events：活动积分配置（如 `config.registration_credits`）可做配置表 + 后台表单。
- Templates、Brand Settings、Reports：按需求加表与页面即可。
