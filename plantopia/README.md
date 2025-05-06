# 🌿 Plantop.ia

An intelligent plant care application that helps you manage and care for your plants.

## 🛠️ Tech Stack

* **Framework**: [Next.js 15](https://nextjs.org/) with App Router
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Backend Services**: [Firebase](https://firebase.google.com/)
  * Authentication
  * Firestore (Database)
  * Cloud Storage
  * Hosting
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Form Handling**: [React Hook Form](https://react-hook-form.com/)
* **Validation**: [Zod](https://zod.dev/)
* **Testing**: Jest & React Testing Library

## 📈 Test Coverage

```
Statements   : 88.05% ( 59/67 )
Branches     : 37.5% ( 3/8 )
Functions    : 100% ( 13/13 )
Lines        : 89.06% ( 57/64 )
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run tests with coverage report:
```bash
npm run test:coverage
```

Available test commands:
- `npm test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage report
- `npm run test:ci`: Run tests in CI mode with JSON output

## 📱 Features

- Google Authentication
- User Profile Management
- Plant Care Dashboard
- Plant Inventory System (Coming Soon)
- Care Reminders (Coming Soon)
- Weather Integration (Coming Soon)
