# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Commands
- `pnpm dev` - Start development server (all packages)
- `pnpm build` - Build all packages in dependency order
- `pnpm test` - Run unit tests (Jest)
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- `pnpm test:all` - Run both unit and e2e tests
- `pnpm lint` - Lint all packages using Next.js ESLint config

### Testing Commands
- `pnpm test:watch` - Run Jest in watch mode for TDD
- `pnpm test:e2e-ui` - Open Playwright UI for interactive test debugging
- `pnpm test --testPathPattern="specific-test"` - Run specific test files
- `pnpm test --coverage` - Generate test coverage report

### Utility Commands
- `pnpm clean` - Remove build artifacts and node_modules
- `pnpm execute-checklist` / `pnpm dod-check` - Run definition of done checklist

## Tech Stack
- **Frontend**: Next.js 14.2 (App Router) + TypeScript 5.4 + Tailwind CSS + Shadcn/ui components
- **Database**: PostgreSQL via Supabase (with Row Level Security)
- **AI**: Google Gemini API for intelligent pet care advice
- **Email**: Resend API for transactional emails in Chinese
- **State Management**: Zustand
- **Testing**: Jest for unit tests, Playwright for e2e tests
- **Package Manager**: pnpm 9.15.0 with Turborepo for monorepo management

## Project Architecture

### Monorepo Structure
```
/apps/web                         # Main Next.js application
  /src/app                       # App Router pages and API routes
    /api                        # API route handlers
      /auth                     # Authentication endpoints
      /pets                     # Pet management endpoints  
      /email                    # Email service endpoints
      /cron                     # Scheduled job endpoints
  /src/components               # React components using Shadcn/ui
  /src/lib                      # Utilities (Supabase client, etc.)
  /database                     # SQL migration files
  /e2e                         # Playwright e2e tests

/packages
  /services                     # Shared business logic
    - Email service (Resend integration)
    - AI service (Gemini integration)
    - Notification service
  /shared-types                # TypeScript type definitions
  /config                      # Shared configuration
```

### API Architecture
- **Authentication**: Supabase Auth with cookie-based sessions
- **API Routes**: Next.js route handlers in `/app/api`
- **Database Access**: Supabase client with RLS policies
- **Cron Jobs**: Protected endpoints for scheduled tasks (daily at 2 AM, notifications at 8 AM/12 PM/4 PM/8 PM)

## Environment Variables
Create `.env.local` in `/apps/web`:
```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Service role for server-side operations
GEMINI_API_KEY=                 # Google Gemini API key
RESEND_API_KEY=                 # Resend email service key
CRON_SECRET=                    # Secret for cron job authentication
```

## Database Setup
Run migrations in order from `/apps/web/database/`:
1. `01_create_pets_table.sql`
2. `02_create_journal_entries_table.sql`
3. `03_add_journal_entries_indexes.sql`
4. `04_create_events_table.sql`
5. `05_add_notification_tracking.sql`

## Key Features & Implementation Details

### Pet Management System
- Pet profiles with breed-specific information
- Journal entries for daily care tracking
- AI-powered analysis of journal entries
- Automated event generation for care schedules

### Email System
- Chinese language support with proper UTF-8 encoding
- HTML email templates using Resend
- Delivery tracking and monitoring
- Test endpoints at `/api/email/test` and `/api/email/test-simple`

### AI Integration
- Google Gemini for intelligent care advice
- Context-aware recommendations based on pet profiles
- Chinese language generation for notifications
- Analysis of journal entries for health insights

### Authentication Flow
- Supabase Auth with email/password
- Cookie-based session management
- Row Level Security for data isolation
- Protected API routes with middleware

## Testing Strategy
- **Unit Tests**: Component and utility testing with Jest
- **E2E Tests**: Critical user flows with Playwright
- **Test Organization**: 
  - Unit tests in `__tests__` directories
  - E2E tests in `/apps/web/e2e`
- **Mocking**: Supabase and next-intl mocked for unit tests

## Deployment
- **Platform**: Vercel (configured in `vercel.json`)
- **Build**: Turborepo handles dependency order
- **Environment**: Set all env vars in Vercel dashboard
- **Cron Jobs**: Configure in Vercel cron settings

## Recent Updates (2025-07-30)
- Fixed signup form color scheme to use green primary color
- Fixed purple focus borders using proper Shadcn/ui components
- Enhanced UX with better design system and components