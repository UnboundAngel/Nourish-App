# Nourish Application Updates

This file will track all major updates and changes to the application.

## 2025-12-04

-   **Features:**
    -   Implemented desktop reminders for meals and hydration.
    -   Added settings to enable/disable desktop reminders.
    -   Notifications are now marked as read when the notification panel is opened.
-   **Bug Fixes:**
    -   Fixed a visual bug where unread notifications had a hardcoded background color that clashed with themes.
    -   Fixed the welcome screen not appearing for new anonymous users.
-   **Backend:**
    -   Pivoted from Firebase Functions to a Vercel-based solution for the backend.
    -   The plan is to use Vercel Serverless Functions with Resend for sending email reminders.
-   **Documentation:**
    -   Updated `TODO.md` with a more comprehensive list of future features and QoL improvements.

## 2025-12-03

-   **Architecture:**
    -   Implemented a local-first architecture. The app now works offline by default, storing data in the browser's `localStorage`.
    -   Added a `storage.js` module to abstract the storage layer.
    -   Implemented cloud sync with Firebase for authenticated users.
-   **Features:**
    -   The app now works without an account. Data is stored locally and synced to the cloud upon login.
    -   Added a streak celebration animation.
-   **Bug Fixes:**
    -   Fixed a data duplication issue that was causing the meal entries to be duplicated.
    -   Fixed a bug in the "Habit & Patterns" widget that was causing the "Breakfast" tab to be constantly filled.
    -   Fixed the streak animation not being triggered reliably.
-   **UI Improvements:**
    -   Added click animations to most interactive elements to improve user feedback.
    -   Updated the "Habit & Patterns" widget to display full category names instead of abbreviations.
    -   Replaced the `FireExtinguisher` icon with a `Flame` icon for the streak counter.

## 2025-12-02

-   **Project Initialization:**
    -   Created the `docs` folder.
    -   Added `architecture.md` to document the project's structure.
    -   Added `updates.md` to track changes.
-   **Documentation:**
    -   Created `README.md` in the project root with a description, features, technologies, and architecture overview.
-   **Project Setup:**
    -   Initialized a Vite project.
    -   Installed dependencies: `react`, `react-dom`, `firebase`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`.
    -   Configured Tailwind CSS.
    -   Set up the main entry point to render the Nourish app.