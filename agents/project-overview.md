# SourTheBakery Project Overview

## Project Type
Next.js 15 e-commerce bakery website with admin dashboard

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API routes, Firebase (Auth, Firestore, Storage)
- **Payment**: Stripe integration with webhooks
- **Email**: AWS SES for order confirmations and newsletters
- **Deployment**: Configured for standalone output

## Key Architecture Patterns
- App Router with server/client component separation
- Context-based state management (Cart, Admin Auth)
- Service layer in `app/lib/` for business logic
- API routes for server-side operations
- Firebase integration for data persistence

## Core Features
1. **Product Management**: CRUD operations with image upload
2. **Shopping Cart**: Context-based state with quantity limits
3. **Order System**: Stripe checkout with automated email confirmations
4. **Admin Dashboard**: Protected routes with UID-based authentication
5. **Weekly Inventory**: Product caps with automatic tracking
6. **Newsletter**: Email subscription system
7. **Order Window**: Time-based ordering restrictions

## Environment Requirements
See CLAUDE.md for complete list of required environment variables including Firebase config, Stripe keys, AWS SES credentials, and admin UID.