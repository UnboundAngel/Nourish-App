# Project To-Do List

This document outlines pending tasks and future improvements for the Nourish application.

## High Priority

-   **Configure Firestore Security Rules:** Implement Firestore security rules to ensure users can only read and write their own data, following the detailed prompt previously provided.
-   **Local `handleToggleFinish`:** Update the `handleToggleFinish` function to handle local state changes and persist them to `localStorage` when the user is not authenticated.

## Future Enhancements & Refactoring

-   **Backend Implementation:** Implement the Vercel-based backend for email reminders. This includes setting up the Vercel project, creating the serverless function, and integrating with the Resend API.
-   **Desktop App Conversion:** Explore converting the application into a desktop app using frameworks like Electron or Tauri. This will involve adapting the storage layer to use local files instead of `localStorage`.
-   **Componentization:** Refactor the monolithic `src/App.jsx` into smaller, reusable components to improve maintainability and scalability, as suggested by the initial architecture analysis.
-   **Data Migration Strategy:** Develop a clear strategy for migrating existing `localStorage` data to a file-based system if the application is converted to a desktop app.

## Feature Backlog / QoL Improvements

1.  **Meal logging card (core feature)**
    -   For each slot (BRE / LUN / DIN / SNA):
        -   Dish name, calories, protein / carbs / fat.
    -   Quick-add buttons: “Same as yesterday”, “From favorites”, “Custom”.
    -   Simple tags: [Home-cooked], [Fast food], [Snack], [Drink].

2.  **Daily targets + progress rings**
    -   At the top or near “Today’s Meals”:
        -   Calories target + ring.
        -   Protein target + ring.
    -   Optional: steps/workout sync later.
    -   Each logged meal updates rings visually like your hydration card.

3.  **Weekly overview screen**
    -   Click on the calendar / habit section to open a separate view:
        -   7-day streak of: logging meals, hitting hydration, hitting calorie/protein target.
        -   Simple graphs: calories per day, protein per day, water per day.

4.  **Meal presets / favorites**
    -   Per-meal “Save as preset” button.
    -   Presets grouped by type (Breakfast / Lunch / etc.).
    -   Floating “+” button opens: [Log quick meal] → [from preset / from scratch].

5.  **Simple notes + mood/energy check-in**
    -   on the left bar, add a sticky note feature, which can be dragged onto a meal to stick it to that day:
        -   Mood (1–5), Energy (1–5), short note.
    -   Weekly view can show: “You feel best on days with X–Y calories / when you eat breakfast.”

6.  **Smart reminders**
    -   Time-based nudges: “Breakfast window”, “Lunch window”, “Hydration every 2h”.
    -   Tie into your “Daily Whisper” so it can show context-aware messages like
        “You’ve only logged 1 meal so far; don’t forget dinner.”

7.  **Grocery / planning side panel (later)**
    -   Switch between “Today” and “Plan week”.
    -   Planning mode: schedule meals for the week.
    -   Button to auto-generate a grocery list from planned meals.

8.  **Barcode Scanning**
    -   Integrate a barcode scanning library to quickly add packaged foods by scanning their barcode.

9.  **Recipe Integration**
    -   Allow users to import recipes from URLs.
    -   Automatically parse ingredients and nutritional information from imported recipes.

10. **Social Features**
    -   Allow users to share their meals or progress with friends.
    -   Create a community feed where users can see each other's public meals.

11. **Achievements and Gamification**
    -   Add achievements for milestones (e.g., 7-day streak, hitting calorie targets).
    -   Implement a points or leveling system to encourage engagement.

12. **Data Export**
    -   Allow users to export their data to CSV or JSON formats.

13. **Custom Themes**
    -   Add more pre-built themes.
    -   Allow users to create and save their own custom themes.

14. **Accessibility Improvements**
    -   Ensure proper use of ARIA labels and roles.
    -   Verify full keyboard navigability.
    -   Check color contrast ratios for all themes.

## Completed Tasks

-   **Search and Filtering:** Added a search bar to filter meals by name, and a tag-based filtering system. Also implemented sorting by date and calories.
-   **Update Firebase API Key:** Replaced the placeholder API key in `src/App.jsx` with the actual Firebase project configuration.
-   **Enable Anonymous Sign-in:** Enabled the "Anonymous" sign-in method in the Firebase project's Authentication settings.
-   **Created `TODO.md` file:** This file was created to track project tasks.