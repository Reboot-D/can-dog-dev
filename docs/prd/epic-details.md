# Epic Details

## Epic 1: Foundation & Core User Experience

**Expanded Goal:** This foundational epic covers all the necessary setup and core functionality for a user to get started. By the end of this epic, the project will be fully initialized with a database and authentication. Users will be able to sign up, log in, perform full CRUD (Create, Read, Update, Delete) operations on their pet profiles, and view an initial, functional dashboard that displays the most critical information for a selected pet.

---

### **Story 1.1: Project Initialization & Supabase Setup**
* **As a** developer, **I want** the monorepo project structure to be initialized with Next.js and connected to Supabase, **so that** I have a foundational environment to start building features.
* **Acceptance Criteria:**
    1.  The monorepo structure is created.
    2.  A new Next.js with TypeScript application is scaffolded inside the `/apps/web` directory.
    3.  The Supabase client is installed and configured.
    4.  A basic test connection to Supabase is successful.
    5.  A simple page can be successfully deployed to Vercel.

---

### **Story 1.2: Setup Localization Framework**
* **As a** developer, **I want** to integrate an internationalization (i18n) library and establish the process for managing Chinese text, **so that** all future UI components can be built with Chinese language support from the start.
* **Acceptance Criteria:**
    1.  An i18n library (e.g., `next-intl`) is installed and configured in the Next.js app.
    2.  A file structure for storing Simplified Chinese text strings is created.
    3.  A sample component correctly displays text from the Chinese language file.

---

### **Story 1.3: User Authentication**
* **As a** new user, **I want** to be able to sign up for an account, log in, and log out, **so that** I can access the application's features securely.
* **Acceptance Criteria:**
    1.  A "Sign Up" page and a "Login" page are created.
    2.  Users can successfully register an account, which creates a user in Supabase Auth.
    3.  Registered users can successfully log in and are redirected to the dashboard.
    4.  Logged-in users can log out.
    5.  Dashboard routes are protected from unauthenticated users.
    6.  All UI text on these pages is in Simplified Chinese.

---

### **Story 1.4: Create & View Pet Profiles**
* **As a** logged-in user, **I want** to create a profile for my pet and see a list of all my pets, **so that** I can start managing their information.
* **Acceptance Criteria:**
    1.  A `pets` table is created in the Supabase database.
    2.  An "Add a Pet" form is available to logged-in users.
    3.  Submitting the form creates a new record in the `pets` table, linked to the current user.
    4.  The user can see the new pet in a list of their pets.
    5.  All UI text is in Simplified Chinese.

---

### **Story 1.5: Implement Dashboard with Pet Switcher**
* **As a** logged-in user with multiple pets, **I want** a dashboard with a pet switcher, **so that** I can easily select which pet's information I am currently viewing.
* **Acceptance Criteria:**
    1.  The main dashboard page displays a list of the logged-in user's pets.
    2.  Clicking on a pet's name sets it as the "active pet".
    3.  The UI clearly indicates which pet is active.
    4.  If a user has no pets, a message in Simplified Chinese prompts them to add one.

---

### **Story 1.6: Display Next Upcoming Event on Dashboard**
* **As a** user viewing the dashboard for a selected pet, **I want** to see the most important upcoming event, **so that** I am immediately aware of what's next.
* **Acceptance Criteria:**
    1.  The dashboard has a prominent section to display the next event.
    2.  The section displays the event's title and due date.
    3.  If no events exist, a friendly message in Simplified Chinese is displayed.
    4.  *(Developer Note: Event data can be from a placeholder for this story).*

---

### **Story 1.7: Update & Delete Pet Profiles**
* **As a** logged-in user, **I want** to be able to edit and delete my pet's profiles, **so that** I can keep their information accurate.
* **Acceptance Criteria:**
    1.  Users can access "Edit" and "Delete" functions for their pets.
    2.  The "Edit" form is pre-populated and successfully updates the pet's record in Supabase.
    3.  The "Delete" function shows a confirmation dialog (in Simplified Chinese) before removing the record.

---

## Epic 2: Interactive Journaling & AI Insights

**Expanded Goal:** This epic introduces the core 'smart' functionality of the application. By the end of this epic, users will be able to create, save, and view a historical log of journal entries for their pets, and each new entry will be analyzed by the Gemini API to provide immediate, helpful, and cautious advice.

---

### **Story 2.1: Implement Journal Entry Creation & Storage**
* **As a** user viewing the dashboard, **I want** a simple way to write and save a journal entry for my selected pet, **so that** I can keep a permanent record of their daily condition.
* **Acceptance Criteria:**
    1.  A `journal_entries` table is created in the Supabase database.
    2.  The dashboard includes a text input area and a "Save Entry" button (in Simplified Chinese).
    3.  Clicking "Save" stores the entry in the `journal_entries` table.
    4.  A success confirmation in Simplified Chinese is shown.

---

### **Story 2.2: Display Journal History**
* **As a** user, **I want** to view a chronological list of all past journal entries for my selected pet, **so that** I can easily review their health history.
* **Acceptance Criteria:**
    1.  A section on the dashboard displays past journal entries for the active pet.
    2.  Entries are sorted with the most recent first.
    3.  If a pet has no entries, a message in Simplified Chinese is displayed.

---

### **Story 2.3: Integrate Gemini API for Journal Analysis**
* **As a** user, **I want** my new journal entry to be analyzed by the pet care AI when I save it, **so that** I can receive helpful insights.
* **Acceptance Criteria:**
    1.  A Vercel serverless function is created to securely call the Gemini API.
    2.  When a new journal entry is saved, the frontend calls this function.
    3.  The prompt to Gemini instructs it to act as a cautious, non-veterinary pet care advisor and respond in Simplified Chinese.
    4.  The UI displays a loading indicator.

---

### **Story 2.4: Display AI-Powered Advice**
* **As a** user who has submitted a journal entry, **I want** to see the AI's advice clearly displayed, **so that** I can understand the insights.
* **Acceptance Criteria:**
    1.  The advice from the Gemini API is displayed in the UI.
    2.  The advice is clearly labeled in Simplified Chinese as being from the "AI Assistant".
    3.  The advice itself is in Simplified Chinese.
    4.  If the API call fails, a user-friendly error message in Simplified Chinese is displayed.

---

## Epic 3: Automated Scheduling & Proactive Notifications (Revised)

**Expanded Goal:** This final epic automates the core value proposition of the application, transforming it from a reactive journal into a proactive assistant. We will build a background scheduling system that analyzes pet data to predict and create future care events, and integrate the Resend API to send timely, AI-enriched email notifications.

---

### **Story 3.1: Define & Store Standard Care Schedules**
* **As a** developer, **I want** to define and store standardized pet care schedules, **so that** the system has a reliable reference to generate future events.
* **Acceptance Criteria:**
    1.  A table or configuration file holds generic care schedule rules from trusted veterinary sources.
    2.  The structure supports different event types and recurrence rules.
    3.  Initial care schedules for dogs and cats are populated.

---

### **Story 3.2: Implement Automated Event Creation Logic**
* **As a** developer, **I want** to create a function that analyzes a pet's profile against the standard care schedules, **so that** it can create necessary future events.
* **Acceptance Criteria:**
    1.  An `events` table is created in the Supabase database.
    2.  A reusable function takes a `pet_id`, reads the pet's data, compares it against the standard schedules, and creates new records in the `events` table.

---

### **Story 3.3: Set Up a Daily Scheduled Task (Cron Job)**
* **As a** developer, **I want** to set up a daily scheduled task that runs the event creation logic for all pets, **so that** the system is always proactively managing schedules.
* **Acceptance Criteria:**
    1.  A Vercel Cron Job is configured to run daily at UTC+8.
    2.  The job triggers a serverless function that executes the event creation logic for all pets.
    3.  The job includes basic success/failure logging.

---

### **Story 3.4: Integrate Resend API for Email Notifications**
* **As a** developer, **I want** to integrate the Resend API and create an email sending service, **so that** the application has the capability to send notifications.
* **Acceptance Criteria:**
    1.  The `RESEND_API_KEY` is securely stored.
    2.  A reusable serverless function is created to send emails via Resend.
    3.  A test email in Simplified Chinese can be successfully sent.

---

### **Story 3.5: Implement AI-Enriched Notification Logic**
* **As a** user, **I want** to receive a smart, personalized email notification for my pet's upcoming events, **so that** I get helpful context and tips.
* **Acceptance Criteria:**
    1.  A daily scheduled task checks for events due within a specific timeframe.
    2.  For each event, the system sends context (pet name, breed, event) to the Gemini API.
    3.  The prompt asks for a friendly reminder and a relevant tip, in Simplified Chinese.
    4.  The AI-generated content is used as the email body and sent via the Resend service.
    5.  The system prevents sending duplicate notifications.