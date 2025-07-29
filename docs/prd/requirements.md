# Requirements

## Functional

1.  **FR1: User Management:** Users must be able to create an account, log in, and log out using Supabase Authentication.
2.  **FR2: Pet Profile Management:** A logged-in user must be able to create, view, update, and delete profiles for their pets. A user can have multiple pets associated with their account.
3.  **FR3: Dashboard View:** The application must have a primary dashboard that displays care information for a single, selected pet.
4.  **FR4: Pet Switching:** If a user has more than one pet, the dashboard must feature a simple control to switch the active view between their pets.
5.  **FR5: Upcoming Event Display:** The dashboard must prominently display the next single most important or time-sensitive event for the currently selected pet.
6.  **FR6: Journaling & History:** Users must be able to create new, timestamped journal entries for a selected pet. All submitted entries must be permanently saved and viewable in a historical log for that pet.
7.  **FR7: AI-Powered Advice:** When a user submits a new journal entry (as described in FR6), that same entry is also sent to the Gemini API for analysis. The AI's response, formatted as cautious advice, must be displayed to the user.
8.  **FR8: Automated Scheduling:** The system must have an automated, recurring background process (scheduled to run daily at UTC+8 on Vercel) that analyzes pet profiles to create and schedule future care events (e.g., vaccine due dates).
9.  **FR9: Email Notifications:** The system must use the Resend API to send email notifications to users about upcoming scheduled events.

## Non-Functional

1.  **NFR1: Simplicity & Elegance:** The user interface must be clean, intuitive, and easy to use, avoiding any unnecessary visual clutter or complex features, in line with the "personal assistant" goal.
2.  **NFR2: Security:** All user data, especially personal information and API keys, must be handled securely. The application must prevent users from seeing data belonging to other users.
3.  **NFR3: Technology Stack Adherence:** The application must be built on Vercel using Supabase for the database/auth and Resend for emails, as specified.
4.  **NFR4: Responsiveness:** The website must be fully functional and usable on both standard desktop and mobile web browsers.
5.  **NFR5: AI Behavior:** The Gemini API integration must be prompted in a way that ensures its responses are consistently cautious, advisory, and never present themselves as a definitive veterinary diagnosis.
6.  **NFR6: Localization:** The entire application, including all user-facing text and AI-generated content, must be presented in Simplified Chinese.
