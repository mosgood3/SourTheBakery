# Development Patterns & Conventions

## Code Style
- TypeScript strict mode enabled
- No comments added unless explicitly requested
- Follow existing patterns and conventions
- Use existing libraries (check package.json first)

## Component Patterns
- Server components by default
- Client components marked with 'use client'
- Context providers for global state
- Props interfaces defined inline or exported

## State Management
- **Cart State**: `CartContext.tsx` with reducer pattern
- **Admin Auth**: `AdminAuthContext.tsx` with UID-based validation
- Local state with useState for component-specific data
- Server state managed through Firebase services

## API Route Patterns
- Rate limiting on public endpoints
- Input validation using `input-validator.ts`
- Error handling with proper HTTP status codes
- Webhook verification for external services

## Database Patterns
- Firestore collections: `products`, `orders`, `settings`, `newsletter`
- Server timestamps for created/updated fields
- Soft validation with try/catch error handling
- Weekly inventory tracking with automatic updates

## Authentication Flow
- Firebase Auth for admin login
- UID comparison against `NEXT_PUBLIC_ADMIN_UID`
- Protected routes with middleware checks
- Session persistence across page reloads

## File Upload Pattern
- Firebase Storage for product images
- Upload utilities in `storage.ts`
- Automatic cleanup on product deletion
- Image optimization through Next.js config

## Email Integration
- AWS SES for transactional emails
- Order confirmation automation
- Newsletter subscription management
- Rich HTML templates with order details

## Common Development Commands
```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm start           # Production server
```