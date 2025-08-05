# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Build**: `npm run build`
- **Production server**: `npm start`
- **Lint**: `npm run lint`

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_UID` (for admin access)
- `STRIPE_SECRET_KEY` (for payment processing)
- `STRIPE_WEBHOOK_SECRET` (for webhook verification)
- `AWS_ACCESS_KEY_ID` (for email service)
- `AWS_SECRET_ACCESS_KEY` (for email service)
- `AWS_REGION` (defaults to us-east-1)
- `SES_FROM_EMAIL` (sender email address)
- `SES_REPLY_TO_EMAIL` (reply-to email address)

## Architecture Overview

This is a Next.js 15 bakery e-commerce website with the following key components:

### Frontend Architecture
- **App Router**: Uses Next.js 15 app directory structure
- **Styling**: Tailwind CSS 4 with custom configurations
- **State Management**: React Context for cart and admin authentication
- **UI Components**: React components with TypeScript in `app/components/`

### Backend Integration
- **Firebase Services**: Authentication, Firestore database, and Storage
- **Payment Processing**: Stripe integration for checkout
- **Email Services**: AWS SES for order confirmations and newsletters
- **API Routes**: Next.js API routes in `app/api/` for server-side operations

### Key Directory Structure
- `app/` - Next.js app router pages and components
- `app/admin/` - Admin dashboard with authentication-protected routes
- `app/api/` - Server-side API endpoints
- `app/components/` - Reusable React components
- `app/contexts/` - React Context providers for global state
- `app/lib/` - Utility functions and service integrations
- `public/` - Static assets including product images

### Admin System
Admin access is controlled by UID-based authentication in `AdminAuthContext.tsx`. The admin UID must be set in `NEXT_PUBLIC_ADMIN_UID` environment variable. Only users with matching UIDs can access `/admin` routes.

### Firebase Integration
- Authentication for admin login
- Firestore for data storage
- Storage for image uploads
- Configuration handled in `app/lib/firebase.ts`

### Payment & Orders
- Stripe integration for payment processing
- Order management through admin dashboard
- Email confirmations via AWS SES

### Key Features
- Product showcase with cart functionality
- Admin dashboard for managing products, orders, and settings
- Newsletter subscription system
- Order status tracking with automated email confirmations
- Stripe payment processing with webhook integration
- Responsive design optimized for all devices

### Order Flow
1. Customer places order → Stripe processes payment
2. Stripe webhook creates order in Firestore with 'open' status
3. Automated confirmation email sent to customer with pickup details
4. Admin can view 'open' orders and mark them as 'completed'
5. Orders are automatically scheduled for pickup on next Sunday 9 AM - 12 PM

## Development Notes

- Uses standalone output configuration for deployment
- Image optimization configured for Firebase Storage
- Security headers and performance optimizations in `next.config.ts`
- TypeScript strict mode enabled
- ESLint configuration prevents builds with errors