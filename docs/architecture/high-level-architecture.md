# High Level Architecture

## Technical Summary

The system is designed as a modern, full-stack **serverless application**. The frontend, built with **Next.js**, will be served globally by **Vercel's Edge Network**. Backend logic will be handled by **Vercel Serverless Functions**, which will interact with our external services. All core data, user authentication, and file storage will be managed by **Supabase** as our Backend-as-a-Service (BaaS). The entire project will be contained within a **Monorepo** to streamline development and ensure type safety across the stack. This architecture prioritizes rapid development, scalability, and low operational overhead, perfectly aligning with our MVP goals.

## Platform and Infrastructure Choice

* **Platform:** **Vercel**.
* **Key Services:** Supabase (Database, Auth, Storage), Resend (Emails), Google Gemini API (AI Analysis).
* **Deployment Host and Regions:** Vercel's global edge network.

## Repository Structure

* **Structure:** **Monorepo**.
* **Monorepo Tool:** **Turborepo**.
* **Package Organization:** Standard `/apps` and `/packages` structure.

## High Level Architecture Diagram

This diagram illustrates the main components and data flows of the system. A User interacts with the PetCare App in their browser. The app is served by the Vercel Platform's Edge Network, and its API calls are handled by Vercel Serverless Functions. These functions interact with Supabase for data/auth, and with the Gemini and Resend APIs for AI and email services. Vercel Cron Jobs also trigger the serverless functions for scheduled tasks.

## Architectural and Design Patterns

* **Serverless Architecture:** Using Vercel Functions for all backend logic.
* **Backend-as-a-Service (BaaS):** Offloading core functionality to Supabase.
* **Component-Based UI:** Using React and Next.js.
* **API Layer via Serverless Functions:** Securely handling backend logic via Next.js API Routes.
