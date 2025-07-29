# PetCare AI Product Requirements Document (PRD)

## Goals and Background Context

### Goals

* To create a simple, elegant, and useful web application that acts as a personal assistant for pet care.
* To support multiple users (the user and their friends) and multiple pets per user.
* To leverage the Gemini API to automatically generate personalized care schedules (e.g., vaccinations, grooming).
* To provide cautious, AI-driven advice by analyzing user-submitted journal entries about their pet's daily condition.
* To proactively notify users of upcoming important events in their pet's schedule.

### Background Context

Many pet owners struggle to manage the complex scheduling of their pet's health and wellness needs. Remembering vaccination dates, grooming appointments, and interpreting minor day-to-day changes in a pet's behavior can be challenging.

This project aims to solve this problem by creating a centralized, intelligent platform. It will serve as a personal assistant, not a commercial product, for a close-knit group of friends. By integrating with the Gemini API, the application will provide automated, proactive, and personalized care plans, moving beyond simple reminders to offer advisory insights, helping owners take the best possible care of their beloved pets.

### Change Log

| Date            | Version | Description                                       | Author     |
| :-------------- | :------ | :------------------------------------------------ | :--------- |
| 2025-07-27      | 1.0     | Initial PRD draft based on brainstorming session. | John (PM)  |

## Requirements

### Functional

1.  **FR1: User Management:** Users must be able to create an account, log in, and log out using Supabase Authentication.
2.  **FR2: Pet Profile Management:** A logged-in user must be able to create, view, update, and delete profiles for their pets. A user can have multiple pets associated with their account.
3.  **FR3: Dashboard View:** The application must have a primary dashboard that displays care information for a single, selected pet.
4.  **FR4: Pet Switching:** If a user has more than one pet, the dashboard must feature a simple control to switch the active view between their pets.
5.  **FR5: Upcoming Event Display:** The dashboard must prominently display the next single most important or time-sensitive event for the currently selected pet.
6.  **FR6: Journaling & History:** Users must be able to create new, timestamped journal entries for a selected pet. All submitted entries must be permanently saved and viewable in a historical log for that pet.
7.  **FR7: AI-Powered Advice:** When a user submits a new journal entry (as described in FR6), that same entry is also sent to the Gemini API for analysis. The AI's response, formatted as cautious advice, must be displayed to the user.
8.  **FR8: Automated Scheduling:** The system must have an automated, recurring background process (scheduled to run daily at UTC+8 on Vercel) that analyzes pet profiles to create and schedule future care events (e.g., vaccine due dates).
9.  **FR9: Email Notifications:** The system must use the Resend API to send email notifications to users about upcoming scheduled events.

### Non-Functional

1.  **NFR1: Simplicity & Elegance:** The user interface must be clean, intuitive, and easy to use, avoiding any unnecessary visual clutter or complex features, in line with the "personal assistant" goal.
2.  **NFR2: Security:** All user data, especially personal information and API keys, must be handled securely. The application must prevent users from seeing data belonging to other users.
3.  **NFR3: Technology Stack Adherence:** The application must be built on Vercel using Supabase for the database/auth and Resend for emails, as specified.
4.  **NFR4: Responsiveness:** The website must be fully functional and usable on both standard desktop and mobile web browsers.
5.  **NFR5: AI Behavior:** The Gemini API integration must be prompted in a way that ensures its responses are consistently cautious, advisory, and never present themselves as a definitive veterinary diagnosis.
6.  **NFR6: Localization:** The entire application, including all user-facing text and AI-generated content, must be presented in Simplified Chinese.

## User Interface Design Goals

### Overall UX Vision

The user experience will be clean, calm, and reassuring, reflecting its purpose as a helpful personal assistant. The design will be minimalist and content-focused, prioritizing clarity and ease of use over distracting visual elements. Every interaction should feel simple, intuitive, and purposeful.

### Key Interaction Paradigms

* **Dashboard-Centric:** The main dashboard will be the hub of the application, providing an at-a-glance summary and access to all key features.
* **Single-Pet Focus:** Although the app supports multiple pets, the UI will always focus on one pet at a time to maintain clarity.
* **Direct Input & Feedback:** Users will interact via simple forms (like the journal), and the AI's feedback will be presented clearly and immediately in the context of their input.
* **Asynchronous Notifications:** To be non-intrusive, proactive reminders will be sent via email rather than disruptive in-app pop-ups.

### Core Screens and Views

* Login / Sign Up Screen
* Main Dashboard
* Pet Profile Management Screen (Create/Edit a pet)
* Journal View (to see history)
* User Settings/Account Screen

### Accessibility: WCAG AA

* We will target **WCAG 2.1 Level AA** compliance as a standard best practice to ensure the site is usable by as many people as possible.

### Branding

* The branding should be soft, clean, and trustworthy, using a simple color palette and a clean, legible font.

### Target Device and Platforms: Web Responsive

* The application will be a responsive website, designed to work seamlessly on both mobile phone browsers and desktop computer browsers.

## Technical Assumptions

### Repository Structure: Monorepo

* A **Monorepo** will be used to keep frontend code, backend API functions, and shared code in a single repository.

### Service Architecture

* A **Serverless Architecture** will be used, with the frontend hosted on Vercel, backend logic in Vercel Serverless Functions, and Supabase acting as the Backend-as-a-Service (BaaS).

### Testing Requirements

* The project will include **Unit and Integration tests**.

### Additional Technical Assumptions and Requests

* **Framework:** **Next.js (a React framework)** will be used to build the website.
* **Language:** **TypeScript** will be used for the entire project.

## Epic List

1.  **Epic 1: Foundation & Core User Experience:** Establish the core application infrastructure, allow users to sign up and manage their pets, and provide the primary dashboard view with the pet switcher and next upcoming event.
2.  **Epic 2: Interactive Journaling & AI Insights:** Enable users to log daily updates about their pets in a journal and receive immediate, AI-powered advisory feedback from the Gemini API.
3.  **Epic 3: Automated Scheduling & Proactive Notifications:** Implement the automated background scheduling system and deliver proactive email notifications to users for upcoming pet care events using the Resend API.

## Epic Details

### Epic 1: Foundation & Core User Experience

**Expanded Goal:** This foundational epic covers all the necessary setup and core functionality for a user to get started. By the end of this epic, the project will be fully initialized with a database and authentication. Users will be able to sign up, log in, perform full CRUD (Create, Read, Update, Delete) operations on their pet profiles, and view an initial, functional dashboard that displays the most critical information for a selected pet.

---

#### **Story 1.1: Project Initialization & Supabase Setup**
* **As a** developer, **I want** the monorepo project structure to be initialized with Next.js and connected to Supabase, **so that** I have a foundational environment to start building features.
* **Acceptance Criteria:**
    1.  The monorepo structure is created.
    2.  A new Next.js with TypeScript application is scaffolded inside the `/apps/web` directory.
    3.  The Supabase client is installed and configured.
    4.  A basic test connection to Supabase is successful.
    5.  A simple page can be successfully deployed to Vercel.

---

#### **Story 1.2: Setup Localization Framework**
* **As a** developer, **I want** to integrate an internationalization (i18n) library and establish the process for managing Chinese text, **so that** all future UI components can be built with Chinese language support from the start.
* **Acceptance Criteria:**
    1.  An i18n library (e.g., `next-intl`) is installed and configured in the Next.js app.
    2.  A file structure for storing Simplified Chinese text strings is created.
    3.  A sample component correctly displays text from the Chinese language file.

---

#### **Story 1.3: User Authentication**
* **As a** new user, **I want** to be able to sign up for an account, log in, and log out, **so that** I can access the application's features securely.
* **Acceptance Criteria:**
    1.  A "Sign Up" page and a "Login" page are created.
    2.  Users can successfully register an account, which creates a user in Supabase Auth.
    3.  Registered users can successfully log in and are redirected to the dashboard.
    4.  Logged-in users can log out.
    5.  Dashboard routes are protected from unauthenticated users.
    6.  All UI text on these pages is in Simplified Chinese.

---

#### **Story 1.4: Create & View Pet Profiles**
* **As a** logged-in user, **I want** to create a profile for my pet and see a list of all my pets, **so that** I can start managing their information.
* **Acceptance Criteria:**
    1.  A `pets` table is created in the Supabase database.
    2.  An "Add a Pet" form is available to logged-in users.
    3.  Submitting the form creates a new record in the `pets` table, linked to the current user.
    4.  The user can see the new pet in a list of their pets.
    5.  All UI text is in Simplified Chinese.

---

#### **Story 1.5: Implement Dashboard with Pet Switcher**
* **As a** logged-in user with multiple pets, **I want** a dashboard with a pet switcher, **so that** I can easily select which pet's information I am currently viewing.
* **Acceptance Criteria:**
    1.  The main dashboard page displays a list of the logged-in user's pets.
    2.  Clicking on a pet's name sets it as the "active pet".
    3.  The UI clearly indicates which pet is active.
    4.  If a user has no pets, a message in Simplified Chinese prompts them to add one.

---

#### **Story 1.6: Display Next Upcoming Event on Dashboard**
* **As a** user viewing the dashboard for a selected pet, **I want** to see the most important upcoming event, **so that** I am immediately aware of what's next.
* **Acceptance Criteria:**
    1.  The dashboard has a prominent section to display the next event.
    2.  The section displays the event's title and due date.
    3.  If no events exist, a friendly message in Simplified Chinese is displayed.
    4.  *(Developer Note: Event data can be from a placeholder for this story).*

---

#### **Story 1.7: Update & Delete Pet Profiles**
* **As a** logged-in user, **I want** to be able to edit and delete my pet's profiles, **so that** I can keep their information accurate.
* **Acceptance Criteria:**
    1.  Users can access "Edit" and "Delete" functions for their pets.
    2.  The "Edit" form is pre-populated and successfully updates the pet's record in Supabase.
    3.  The "Delete" function shows a confirmation dialog (in Simplified Chinese) before removing the record.

---

### Epic 2: Interactive Journaling & AI Insights

**Expanded Goal:** This epic introduces the core 'smart' functionality of the application. By the end of this epic, users will be able to create, save, and view a historical log of journal entries for their pets, and each new entry will be analyzed by the Gemini API to provide immediate, helpful, and cautious advice.

---

#### **Story 2.1: Implement Journal Entry Creation & Storage**
* **As a** user viewing the dashboard, **I want** a simple way to write and save a journal entry for my selected pet, **so that** I can keep a permanent record of their daily condition.
* **Acceptance Criteria:**
    1.  A `journal_entries` table is created in the Supabase database.
    2.  The dashboard includes a text input area and a "Save Entry" button (in Simplified Chinese).
    3.  Clicking "Save" stores the entry in the `journal_entries` table.
    4.  A success confirmation in Simplified Chinese is shown.

---

#### **Story 2.2: Display Journal History**
* **As a** user, **I want** to view a chronological list of all past journal entries for my selected pet, **so that** I can easily review their health history.
* **Acceptance Criteria:**
    1.  A section on the dashboard displays past journal entries for the active pet.
    2.  Entries are sorted with the most recent first.
    3.  If a pet has no entries, a message in Simplified Chinese is displayed.

---

#### **Story 2.3: Integrate Gemini API for Journal Analysis**
* **As a** user, **I want** my new journal entry to be analyzed by the pet care AI when I save it, **so that** I can receive helpful insights.
* **Acceptance Criteria:**
    1.  A Vercel serverless function is created to securely call the Gemini API.
    2.  When a new journal entry is saved, the frontend calls this function.
    3.  The prompt to Gemini instructs it to act as a cautious, non-veterinary pet care advisor and respond in Simplified Chinese.
    4.  The UI displays a loading indicator.

---

#### **Story 2.4: Display AI-Powered Advice**
* **As a** user who has submitted a journal entry, **I want** to see the AI's advice clearly displayed, **so that** I can understand the insights.
* **Acceptance Criteria:**
    1.  The advice from the Gemini API is displayed in the UI.
    2.  The advice is clearly labeled in Simplified Chinese as being from the "AI Assistant".
    3.  The advice itself is in Simplified Chinese.
    4.  If the API call fails, a user-friendly error message in Simplified Chinese is displayed.

---

### Epic 3: Automated Scheduling & Proactive Notifications (Revised)

**Expanded Goal:** This final epic automates the core value proposition of the application, transforming it from a reactive journal into a proactive assistant. We will build a background scheduling system that analyzes pet data to predict and create future care events, and integrate the Resend API to send timely, AI-enriched email notifications.

---

#### **Story 3.1: Define & Store Standard Care Schedules**
* **As a** developer, **I want** to define and store standardized pet care schedules, **so that** the system has a reliable reference to generate future events.
* **Acceptance Criteria:**
    1.  A table or configuration file holds generic care schedule rules from trusted veterinary sources.
    2.  The structure supports different event types and recurrence rules.
    3.  Initial care schedules for dogs and cats are populated.

---

#### **Story 3.2: Implement Automated Event Creation Logic**
* **As a** developer, **I want** to create a function that analyzes a pet's profile against the standard care schedules, **so that** it can create necessary future events.
* **Acceptance Criteria:**
    1.  An `events` table is created in the Supabase database.
    2.  A reusable function takes a `pet_id`, reads the pet's data, compares it against the standard schedules, and creates new records in the `events` table.

---

#### **Story 3.3: Set Up a Daily Scheduled Task (Cron Job)**
* **As a** developer, **I want** to set up a daily scheduled task that runs the event creation logic for all pets, **so that** the system is always proactively managing schedules.
* **Acceptance Criteria:**
    1.  A Vercel Cron Job is configured to run daily at UTC+8.
    2.  The job triggers a serverless function that executes the event creation logic for all pets.
    3.  The job includes basic success/failure logging.

---

#### **Story 3.4: Integrate Resend API for Email Notifications**
* **As a** developer, **I want** to integrate the Resend API and create an email sending service, **so that** the application has the capability to send notifications.
* **Acceptance Criteria:**
    1.  The `RESEND_API_KEY` is securely stored.
    2.  A reusable serverless function is created to send emails via Resend.
    3.  A test email in Simplified Chinese can be successfully sent.

---

#### **Story 3.5: Implement AI-Enriched Notification Logic**
* **As a** user, **I want** to receive a smart, personalized email notification for my pet's upcoming events, **so that** I get helpful context and tips.
* **Acceptance Criteria:**
    1.  A daily scheduled task checks for events due within a specific timeframe.
    2.  For each event, the system sends context (pet name, breed, event) to the Gemini API.
    3.  The prompt asks for a friendly reminder and a relevant tip, in Simplified Chinese.
    4.  The AI-generated content is used as the email body and sent via the Resend service.
    5.  The system prevents sending duplicate notifications.