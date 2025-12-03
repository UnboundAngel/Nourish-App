# Nourish: Your Personal Wellness Companion

Nourish is a health and wellness application designed to help you track your meals, hydration, and overall well-being. Built with React and Firebase, it provides a seamless experience for managing your daily health goals.

## Features

*   **Local-first Support:** Works offline by default. No account needed to start.
*   **Cloud Sync:** Optionally sign in to sync your data across devices with Firebase.
*   **User Authentication:** Secure sign-in options including anonymous, email/password, and Google authentication.
*   **Meal Tracking:** Log and manage your meal entries.
*   **Hydration Tracking:** Monitor your daily water intake.
*   **Wellness Trends:** Visualize your health data over time to identify trends.
*   **Customization:** Personalize your app experience with various theming options.
*   **Daily Streaks & Notifications:** Stay motivated with streaks and timely reminders.

## Technologies Used

*   **Frontend:**
    *   React (Functional Components & Hooks)
    *   Vite
    *   Tailwind CSS
    *   Lucide React (Icons)
*   **Backend:**
    *   Firebase (Authentication, Firestore Database)
    *   Vercel (Serverless Functions for email reminders)
    *   Resend (Email API)

## Architecture Overview

Nourish is a Single-Page Application (SPA) with a local-first architecture. It is built with React and uses Vite as a build tool.

*   **Offline First:** The app stores all data in the browser's `localStorage` by default, allowing it to be used without an internet connection or an account. A dedicated `storage.js` module abstracts the storage logic.
*   **Cloud Sync:** For authenticated users, the app syncs the local data with Firestore, which then becomes the single source of truth.
*   **Monolithic Component:** The entire frontend logic is currently contained within the `src/App.jsx` file.

For a detailed architectural breakdown, please refer to [docs/architecture.md](./docs/architecture.md).

## Setup Instructions

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  **Configure Firebase:**
    *   Create a Firebase project.
    *   Enable **Anonymous**, **Email/Password**, and **Google** sign-in methods in the Firebase Authentication settings.
    *   Create a Firestore database.
    *   Copy your Firebase project configuration and paste it into the `firebaseConfig` object in `src/App.jsx`.
4.  Run the application: `npm run dev`.

## Future Enhancements

Based on initial architectural analysis, future improvements could include:

*   **Componentization:** Breaking down `src/Nourish.jsx` into smaller, reusable components.
*   **Separation of Concerns:** Organizing Firebase interactions and utility functions into dedicated modules.
*   **State Management:** Implementing a global state management solution for complex state.
*   **Routing:** Introducing routing for multi-page navigation as the application grows.
*   **Email Reminders:** Implementing the Vercel-based backend for email reminders.

For more details on proposed architectural improvements, see [docs/architecture.md](./docs/architecture.md).
