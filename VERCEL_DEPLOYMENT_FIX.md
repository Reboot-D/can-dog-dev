# 🚀 Vercel 部署修复指南

## 修复的问题

已解决的 `DEPLOYMENT_NOT_FOUND` 错误，主要原因：
1. **构建命令路径问题**: 原来的 `cd apps/web && pnpm run build` 命令会改变工作目录，导致输出路径不一致
2. **缺乏 Turborepo 优化**: 没有使用 Turbo 的增量构建功能
3. **缺少构建忽略策略**: 每次推送都会触发构建

## 配置更改

### 更新的 `vercel.json` 配置：
```json
{
  "buildCommand": "turbo run build --filter=web",
  "outputDirectory": "apps/web/.next", 
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "ignoreCommand": "git diff HEAD^ HEAD --quiet . ./apps/web",
  "functions": {
    "apps/web/src/app/api/cron/daily-event-generation/route.ts": {
      "maxDuration": 60
    },
    "apps/web/src/app/api/cron/check-notifications/route.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-event-generation",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-notifications", 
      "schedule": "0 12 * * *"
    }
  ]
}
```

## ✅ 环境变量检查清单

### 必需的环境变量
在 Vercel Dashboard → Project Settings → Environment Variables 中设置：

#### Supabase 配置
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥

#### AI 集成
- [ ] `GEMINI_API_KEY` - Google Gemini API 密钥

#### 邮件服务
- [ ] `RESEND_API_KEY` - Resend API 密钥

#### 安全配置
- [ ] `CRON_SECRET` - 定时任务安全密钥（可选但推荐）

### 环境变量设置说明
1. 确保所有环境变量在 **Production** 环境中设置
2. 如果需要预览环境测试，也在 **Preview** 环境中设置
3. 敏感信息（如 API 密钥）应该只在生产环境使用真实值

## 📋 部署验证步骤

### 1. 提交并推送更改
```bash
git add vercel.json
git commit -m "Fix Vercel deployment configuration for monorepo

- Use turbo run build --filter=web for optimal monorepo builds
- Add ignoreCommand to prevent unnecessary builds  
- Maintain existing cron and function configurations

🤖 Generated with Claude Code"
git push origin main
```

### 2. 验证 Vercel 设置
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到项目并进入 Settings
3. 检查 Environment Variables 是否全部设置
4. 确保 Git 集成正常连接

### 3. 触发新部署
- 推送代码后，Vercel 会自动触发新部署
- 也可以在 Deployments 页面手动重新部署

### 4. 验证部署成功
- [ ] 部署状态显示为 "Ready"
- [ ] 网站可以正常访问
- [ ] API 端点正常工作
- [ ] 定时任务配置正确

## 🔧 故障排除

### 如果部署仍然失败：

#### 选项 A: 简化配置
删除 `vercel.json` 并在 Vercel Dashboard 中设置：
- Root Directory: `apps/web`
- Build Command: `pnpm run build`
- Output Directory: `.next`

#### 选项 B: 检查构建日志
1. 在 Vercel Dashboard 查看构建日志
2. 确认所有依赖项正确安装
3. 检查环境变量是否正确设置

#### 选项 C: 本地验证
```bash
# 确保本地构建成功
turbo run build --filter=web

# 检查输出目录
ls -la apps/web/.next
```

## 📞 联系信息

如果问题仍然存在，请检查：
1. GitHub 仓库连接状态
2. Vercel 项目权限设置  
3. 域名配置（如果使用自定义域名）

部署应该在推送后几分钟内完成。