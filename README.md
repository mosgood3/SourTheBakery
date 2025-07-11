# Sour The Bakery

A modern bakery website built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Features

- 🍪 Product showcase with beautiful imagery
- 🛒 Shopping cart functionality
- 🔐 Admin authentication system
- 📱 Responsive design
- 🚀 Optimized performance
- 🔥 Firebase integration for data and storage

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sourthebakery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Add your Firebase configuration to `.env.local`

### Admin Access

To access the admin panel:
1. Create a user account in Firebase Authentication
2. Add the email to the `ADMIN_EMAILS` array in `app/contexts/AdminAuthContext.tsx`
3. Access `/admin` route

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to add these environment variables in your Vercel project settings:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Troubleshooting

### Build Errors

If you encounter Firebase-related build errors:
- Ensure all environment variables are set correctly
- Check that Firebase services are properly configured
- Verify that the Firebase project is active

### Image Loading Issues

- Ensure image files are in the `public` folder
- Check file extensions match exactly (case-sensitive)
- Verify image paths in components

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Icons**: React Icons
- **Deployment**: Vercel

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

## License

This project is private and proprietary.
#   S o u r T h e B a k e r y 
 
 