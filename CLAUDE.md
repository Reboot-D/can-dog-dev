# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server for all apps
- `pnpm build` - Build all packages in the monorepo
- `pnpm test` - Run all unit tests
- `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean build artifacts and node_modules

### Web App Specific (in apps/web/)
- `pnpm dev` - Start Next.js development server
- `pnpm test:watch` - Run Jest tests in watch mode
- `pnpm test:e2e-ui` - Run Playwright tests with UI
- `pnpm test:all` - Run both unit and e2e tests

### Development Tools
- **React DevTools**: Install browser extension from https://reactjs.org/link/react-devtools for enhanced debugging

### Database
Run SQL migrations in order from `apps/web/database/` directory:
1. `01_create_pets_table.sql`
2. `02_create_journal_entries_table.sql` 
3. `03_add_journal_entries_indexes.sql`
4. `04_create_events_table.sql`
5. `05_add_notification_tracking.sql`

## Architecture Overview

### Monorepo Structure
- **apps/web** - Main Next.js application with App Router
- **packages/** - Shared services and types (planned but not implemented yet)
- **Turborepo** - Monorepo management with workspaces

### Tech Stack
- **Frontend**: Next.js 14.2 + TypeScript 5.4 + Tailwind CSS + Shadcn/ui
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL via Supabase with Row Level Security
- **AI**: Google Gemini API for journal analysis
- **Email**: Resend API for notifications
- **State**: Zustand for client state management
- **Testing**: Jest + React Testing Library + Playwright

### Key Components
- **Authentication**: Supabase Auth with middleware protection
- **Pet Management**: CRUD operations for pet profiles
- **Journal System**: Daily care logging with AI-powered analysis
- **Events**: Automated care reminders and scheduling
- **Notifications**: Email system with Chinese language support

### API Structure
- `/api/auth/*` - Authentication endpoints
- `/api/pets/*` - Pet management CRUD
- `/api/pets/[petId]/journal/*` - Journal entries
- `/api/pets/[petId]/events/*` - Event management
- `/api/email/*` - Email sending and testing
- `/api/cron/*` - Scheduled background tasks

### Critical Services
- **Care Schedules**: Breed-specific automated event generation
- **AI Analysis**: Gemini API integration for journal insights
- **Email Templates**: Internationalized notifications
- **Rate Limiting**: API protection mechanisms

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

### Testing Strategy
- **Unit Tests**: Located in `__tests__/` directories alongside components
- **Integration Tests**: API route testing
- **E2E Tests**: Full user flows in `e2e/` directory
- Always run tests before commits: `pnpm test:all`

### Internationalization
- Primary language: Simplified Chinese (zh-CN)
- Messages stored in `src/messages/zh-CN.json`
- AI-generated content supports Chinese context

### Security Features
- Row Level Security (RLS) on all database tables
- Protected routes via middleware
- API key validation
- Input sanitization with Zod schemas