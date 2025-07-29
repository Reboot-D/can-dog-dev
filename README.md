# 🐾 PetCare AI - Intelligent Pet Care Management Platform

A modern, AI-powered pet care platform that helps pet owners track their pets' health, receive intelligent reminders, and get personalized care advice in Chinese.

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Smart Notifications**: AI-generated personalized care reminders in Simplified Chinese
- **Intelligent Advice**: Context-aware pet care tips using Google Gemini AI
- **Automated Event Creation**: Intelligent scheduling based on pet profiles and care schedules

### 📅 Care Management
- **Pet Profiles**: Comprehensive pet information with breed-specific care recommendations
- **Event Tracking**: Automated vaccination, grooming, and health check reminders
- **Journal System**: Daily care logging with AI-powered analysis

### 📧 Communication
- **Email Notifications**: Beautiful HTML emails with Chinese character support
- **Scheduled Reminders**: Daily cron jobs for timely care notifications
- **Delivery Tracking**: Comprehensive email delivery monitoring

### 🛡️ Enterprise Features
- **Authentication**: Secure user management with Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Monitoring**: Comprehensive logging and error tracking
- **Testing**: Full test coverage with Jest and Playwright

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14.2 with App Router, TypeScript 5.4
- **Backend**: Next.js API Routes, Serverless Functions
- **Database**: PostgreSQL 15 via Supabase
- **AI Integration**: Google Gemini API
- **Email Service**: Resend API
- **Deployment**: Vercel with CI/CD
- **Package Manager**: pnpm 9.15.0

### Project Structure
```
petcare-ai/
├── apps/
│   └── web/                 # Main Next.js application
│       ├── src/
│       │   ├── app/         # App Router pages and API routes
│       │   ├── components/  # React components
│       │   ├── lib/         # Utility libraries
│       │   └── types/       # TypeScript type definitions
│       ├── database/        # SQL migration files
│       └── e2e/            # End-to-end tests
├── packages/
│   ├── services/           # Shared services (Email, AI, Notification)
│   ├── shared-types/       # Shared TypeScript types
│   └── config/            # Shared configuration
└── scripts/               # Build and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.15.0
- PostgreSQL database (Supabase recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/Reboot-D/petpalnew.git
cd petpalnew
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
Create a `.env.local` file in the `apps/web` directory:

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Optional: Cron Job Security
CRON_SECRET=your_cron_secret_key

# Optional: Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup
```bash
# Run database migrations
psql -d your_database_url -f apps/web/database/01_enable_rls.sql
psql -d your_database_url -f apps/web/database/02_create_profiles_table.sql
psql -d your_database_url -f apps/web/database/03_create_pets_table.sql
psql -d your_database_url -f apps/web/database/04_create_events_table.sql
psql -d your_database_url -f apps/web/database/05_add_notification_tracking.sql
```

### 5. Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suites
```bash
# Unit tests only
pnpm test --testPathPattern="__tests__"

# Integration tests
pnpm test --testPathPattern="integration"

# End-to-end tests
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test --coverage
```

## 🔧 Development Commands

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=web
```

### Linting
```bash
# Lint all packages
pnpm lint

# Lint with auto-fix
pnpm lint --fix
```

### Cleaning
```bash
# Clean build artifacts and node_modules
pnpm clean
```

## 📡 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

#### Pet Management
- `GET /api/pets` - List user's pets
- `POST /api/pets` - Create new pet profile
- `POST /api/pets/[petId]/events/generate` - Generate automated care events

#### Email System
- `POST /api/email/send` - Send transactional emails
- `GET /api/email/test` - Test email configuration

#### Cron Jobs
- `POST /api/cron/daily-event-generation` - Daily event creation
- `POST /api/cron/check-notifications` - AI notification processing

### Cron Schedule
The platform runs automated tasks:
- **8:00 AM, 12:00 PM, 4:00 PM, 8:00 PM** - Notification checks
- **2:00 AM daily** - Event generation

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables for Production
Ensure all required environment variables are set in your deployment platform:
- Supabase credentials
- Google Gemini API key
- Resend API key
- Cron secret (recommended for security)

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level data isolation
- **API Key Protection** - Secure external service integration
- **Cron Job Authentication** - Optional secret-based protection
- **Input Validation** - Comprehensive request validation
- **HTML Escaping** - XSS prevention in email templates

## 🌏 Internationalization

The platform supports **Simplified Chinese** with:
- AI-generated content in Chinese
- Proper UTF-8 encoding
- Cultural context awareness
- Localized pet care advice

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Reboot-D/petpalnew/issues)
- **Documentation**: Check the `docs/` directory for detailed documentation
- **Email**: Contact the development team for enterprise support

## 🎯 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced AI health monitoring
- [ ] Veterinarian integration
- [ ] Multi-language support expansion
- [ ] IoT device integration
- [ ] Social features for pet communities

---

**Built with ❤️ for pet lovers worldwide**

*PetCare AI - Making pet care intelligent, personalized, and accessible.*