# Nourish (MyMealApp) 🌱

A modern, aesthetic meal and hydration tracker built with React, Tailwind CSS, and Firebase.

## Features
- **Meal Logging:** Track name, calories, macros (P/C/F), and meal type.
- **Hydration Tracker:** Visual water bottle to track daily intake.
- **Daily Streak:** Tracks your consistency over time.
- **Smart Themes:** Four built-in themes (Autumn, Summer, Dark, Light).
- **History & Insights:** Pattern tracking and historical logs.
- **Email Reminders:** Automated daily summaries via Resend API.

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS 4.0, Lucide Icons
- **Backend/Storage:** Firebase (Firestore & Auth)
- **Email:** Resend API (via Vercel Serverless Functions)

## Getting Started
1. Clone the repository.
2. Run `npm install`.
3. Configure your Firebase project in `App.jsx`.
4. Run `npm run dev` to start the development server.

## Deployment
This app is designed to be deployed on Vercel to take advantage of Serverless Functions and Cron Jobs for email reminders.
