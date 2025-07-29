# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **Supabase Project**: Your Supabase database should be set up
3. **Google Gemini API Key**: From [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Resend API Key**: From [Resend Dashboard](https://resend.com/api-keys)

## Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)
```bash
pnpm install -g vercel
```

### 2. Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select your repository

3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `.` (keep as is)
   - Build Command: `cd apps/web && pnpm build`
   - Output Directory: `apps/web/.next`
   - Install Command: `pnpm install`

### 3. Environment Variables

Add these environment variables in Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=generate_a_random_string_here
```

### 4. Deploy via CLI (Alternative)

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: petcare-ai (or your choice)
# - Directory: .
# - Override settings: N
```

### 5. Post-Deployment Setup

1. **Database Migration**:
   - Run SQL migrations from `apps/web/database/` in order
   - Use Supabase SQL Editor

2. **Verify Cron Jobs**:
   - Check Vercel Dashboard > Functions > Cron
   - Two cron jobs should be configured:
     - Daily Event Generation (2 AM)
     - Check Notifications (8 AM, 12 PM, 4 PM, 8 PM)

3. **Domain Configuration** (Optional):
   - Add custom domain in Vercel Dashboard
   - Configure DNS records

## Important Notes

1. **Supabase Configuration**:
   - Ensure Row Level Security (RLS) is enabled on all tables
   - Add your Vercel deployment URL to Supabase allowed URLs

2. **Email Service**:
   - Verify your sending domain in Resend
   - Test email functionality after deployment

3. **Cron Job Security**:
   - The CRON_SECRET protects your cron endpoints
   - Vercel automatically adds this header to cron requests

## Troubleshooting

1. **Build Failures**:
   - Check Node version (requires >=18.0.0)
   - Verify all environment variables are set
   - Check build logs in Vercel Dashboard

2. **Function Timeouts**:
   - Cron functions have 60s timeout configured
   - Regular API routes have default timeout

3. **Database Connection**:
   - Verify Supabase project is not paused
   - Check service role key permissions

## Environment Variable Sources

- **Supabase**: Project Settings > API
- **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Resend**: [API Keys Page](https://resend.com/api-keys)
- **CRON_SECRET**: Generate with `openssl rand -base64 32`