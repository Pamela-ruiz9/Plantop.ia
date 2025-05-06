# 🛠️ Plantop.ia Detailed Development Roadmap

## 🔰 Phase 0: Project Setup

**Goal**: Lay the foundation of the project with tooling and base framework.

* Initialize Next.js 15 project using the TypeScript starter template.
* Configure ESLint and Prettier with standard rules.
* Set up Husky with lint-staged to ensure clean commits.
* Add Tailwind CSS with basic utility configuration.
* Establish folder structure: `app/`, `components/`, `lib/`, `styles/`, `public/`.
* Push initial commit to GitHub.

---

## 🌱 Phase 1: Core Infrastructure

**Goal**: Set up backend services and integrations.

### Firebase Setup

* Create a Firebase project and enable the following:

  * Google Sign-In in Authentication.
  * Firestore Database (native mode).
  * Firebase Storage for image uploads.
  * Firebase Hosting (for future deployment).

### Firebase Integration Code

* Add `lib/firebase.ts` to initialize and export:

  * `auth` from `firebase/auth`
  * `db` from `firebase/firestore`
  * `storage` from `firebase/storage`
* Add `lib/hooks/useAuth.ts` to provide a React hook for auth state.
* Add `lib/hooks/useUser.ts` for user metadata fetching.

### Environment Configuration

* Set up `.env.local` with Firebase config keys.
* Create `.env.example` for sharing with other developers.

---

## 🌿 Phase 2: Authentication & User Onboarding

**Goal**: Let users register, log in, and create a basic profile.

* Build login and logout components using Firebase Google Auth.
* Redirect authenticated users to onboarding on first login.
* Onboarding page includes:

  * Location (auto-detect with fallback input).
  * Experience level (dropdown).
  * Preferred plant types (multi-select tags).
* Save onboarding data to `/users/{uid}` in Firestore.

---

## 🌼 Phase 3: Plant Inventory Management

**Goal**: Enable users to build and manage a personal plant collection.

* Build "Add Plant" form with:

  * Upload photo
  * Common name / species
  * Notes
  * Last watered (date)
* Store plant records in `/users/{uid}/plants/{plantId}`
* Display list of plants on user dashboard
* Include plant card with photo, last watered, and quick actions
* Add edit and delete functionality for each plant

---

## 🌞 Phase 4: Care Schedule & Notifications

**Goal**: Help users track care tasks and receive reminders.

* Add ability to define recurring care tasks (watering, fertilizing, etc.) per plant
* Store care tasks in Firestore under `/users/{uid}/tasks`
* On dashboard, show a list of upcoming and overdue tasks
* Schedule push notifications via Firebase Cloud Messaging (or fallback with email)

---

## 🧠 Phase 5: Plant Intelligence

**Goal**: Use AI and data to provide smart insights for each plant.

* Add a basic ML interface with mock prediction (image upload returns random result)
* Connect prediction with plant care data from a static plant care JSON/db
* Use OpenWeatherMap API to adjust watering advice based on user's location
* Build early disease detection UI: user selects symptoms from a list; app suggests possible issues

---

## 📈 Phase 6: Dashboard & Insights

**Goal**: Give users a clear overview of their plant care.

* Dashboard components:

  * Summary: total plants, overdue tasks, today’s weather
  * Alerts: disease or task issues
  * Task list: calendar-style view
* Track care task completion to build user stats:

  * Streaks, XP system, task history timeline
* Health status visualization (color-coded status per plant)

---

## 🧑‍🤝‍🧑 Phase 7: Community & Social Features

**Goal**: Enable social sharing and interaction.

* Build community feed with plant posts (image + caption)
* Allow other users to like and comment on posts
* Display user profile pages with:

  * Avatar and name
  * Public plant inventory (read-only)
  * Recent activity/posts

---

## 🌤️ Phase 8: Weather & Sensors

**Goal**: Enhance care advice using external and real-world data.

* Integrate OpenWeatherMap API based on user's location from onboarding
* Display 5-day forecast on dashboard
* Cross-reference forecast with care schedule to suggest task modifications
* Create simulated sensor data dashboard:

  * Light, humidity, soil moisture (random or dummy data)
  * Visual display per plant (gauge or line chart)

---

## 🎮 Phase 9: Gamification

**Goal**: Motivate users through rewards and challenges.

* Assign XP for task completion, plant updates, posts
* Define daily, weekly, and monthly challenges (e.g., water 3 plants today)
* Unlock badges for achievements (e.g., 7-day streak, 10 plants added)
* Gamified stats panel on dashboard: level, progress bar, next goal

---

## 🌐 Phase 10: Deployment & Scaling

**Goal**: Launch the app and prepare it for growth.

* Use Firebase Hosting for deployment
* Set up GitHub Actions for CI/CD:

  * On pull request: run lint + test
  * On merge to main: deploy to Firebase
* Optimize performance:

  * Dynamic imports
  * Image optimization
  * Bundle analysis with `next-bundle-analyzer`
* Prepare production Firebase environment + separate dev instance

---

## 🧪 Testing & QA (Parallel Phases)

**Goal**: Ensure high quality and maintainability.

* Unit tests for all utility functions (e.g., form validators)
* Component tests using React Testing Library:

  * Form inputs, plant cards, dashboard widgets
* End-to-end tests with Cypress:

  * Login flow
  * Add/edit/delete plant
  * Complete a task
* Use `msw` (Mock Service Worker) to simulate Firebase and API calls

---

## 📚 Developer Notes

* Use absolute imports (`@/components`, `@/lib`) via `tsconfig.json`
* Use `zod` for schema validation and form sanitization
* Prefer modular architecture: reusable hooks, components, and contexts
* Use `react-query` or `swr` for async data fetching
* Use skeleton loaders and suspense boundaries for smoother UX
