# Story Definition of Done (DoD) Checklist

## Overview
This document defines the standardized Definition of Done checklist that must be completed for every story before it can be marked as "Done" and moved to production.

## Story DoD Checklist Template

### Code Quality & Implementation
- [ ] All acceptance criteria have been fully implemented
- [ ] All tasks and subtasks marked as completed in the story document
- [ ] Code follows established patterns and conventions from the project
- [ ] All new code is properly typed with TypeScript
- [ ] ESLint and TypeScript compiler pass without errors or warnings
- [ ] Code is properly formatted and follows project style guidelines

### Testing Requirements
- [ ] Unit tests written for all new components using Jest/React Testing Library
- [ ] Integration tests created for service layer functionality
- [ ] End-to-end tests implemented using Playwright for critical user flows
- [ ] All tests pass in local development environment
- [ ] Test coverage meets minimum requirements (>80% for new code)
- [ ] Tests include Chinese localization validation where applicable

### Localization & UI
- [ ] All user-facing text is properly internationalized using next-intl
- [ ] Chinese translations added to `/messages/zh-CN.json`
- [ ] UI components are responsive and work on mobile devices
- [ ] Accessibility standards (WCAG AA) are met for new components
- [ ] User interface matches design specifications and project aesthetic

### Database & API
- [ ] Database schema changes properly implemented and documented
- [ ] API endpoints follow established patterns and error handling
- [ ] Row Level Security (RLS) policies are correct and tested
- [ ] Database migrations are reversible and tested
- [ ] Service layer methods include proper error handling

### Documentation & Communication
- [ ] Story document updated with completion status and file list
- [ ] Dev Agent Record section completed with implementation notes
- [ ] QA Review section completed by reviewer
- [ ] Change log updated with version and completion date
- [ ] Any architectural decisions or patterns documented

### Security & Performance
- [ ] No sensitive data exposed in client-side code
- [ ] Authentication and authorization properly implemented
- [ ] Performance impact assessed (no significant regressions)
- [ ] Error handling doesn't expose internal system details
- [ ] Environment variables properly configured and secured

### Integration & Deployment
- [ ] Code integrated with existing features without breaking changes
- [ ] Build process completes successfully
- [ ] Development server runs without errors
- [ ] Ready for Vercel deployment (if applicable)
- [ ] No console errors or warnings in browser

### Review & Approval
- [ ] Code review completed by senior developer
- [ ] QA testing performed and documented
- [ ] Product Owner acceptance of implemented features
- [ ] Scrum Master approval for story completion

## Execute-Checklist Process

### Usage Instructions
1. Copy this checklist to the story document before starting implementation
2. Check off items as they are completed during development
3. All items must be checked before marking story as "Done"
4. Use the execute-checklist script to validate completion

### Automated Validation
The execute-checklist functionality will automatically verify:
- All checkboxes in the story DoD section are marked
- Required files exist and pass linting
- Tests exist and pass
- Documentation is complete

### Story Status Transitions
- **In Progress** → **Ready for Review**: All implementation checkboxes complete
- **Ready for Review** → **Approved**: All review checkboxes complete  
- **Approved** → **Done**: All checklist items verified and signed off

## Checklist Customization by Epic

### Epic 1: Foundation & Core User Experience
Additional requirements:
- [ ] Supabase connection verified
- [ ] Authentication flows tested
- [ ] Basic CRUD operations functional
- [ ] Dashboard navigation working

### Epic 2: Interactive Journaling & AI Insights  
Additional requirements:
- [ ] Gemini API integration tested
- [ ] AI response handling implemented
- [ ] Journal storage and retrieval working
- [ ] Error handling for API failures

### Epic 3: Automated Scheduling & Proactive Notifications
Additional requirements:
- [ ] Cron job functionality tested
- [ ] Email sending via Resend working
- [ ] Event creation logic validated
- [ ] Background processes monitored

## Enforcement

This checklist is mandatory for all stories. Stories cannot be marked as "Done" without:
1. All checklist items verified
2. execute-checklist script passing
3. Proper documentation of completion
4. Sign-off from designated reviewers

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-07-28 | 1.0 | Initial DoD checklist creation | Claude (Assistant) |