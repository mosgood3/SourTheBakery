# Directory Structure Reference

## Root Level
```
├── app/                    # Next.js 15 app directory
├── public/                 # Static assets
├── agents/                 # Development context files
├── CLAUDE.md              # Development instructions
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS 4 config
├── next.config.ts         # Next.js configuration
└── firestore.rules        # Firebase security rules
```

## App Directory Structure
```
app/
├── admin/                 # Admin dashboard (protected routes)
│   ├── gallery/          # Image management
│   ├── login/            # Admin authentication
│   ├── newsletter/       # Newsletter management
│   ├── notifications/    # System notifications
│   ├── orders/           # Order management
│   ├── products/         # Product CRUD
│   ├── settings/         # App settings
│   └── layout.tsx        # Admin layout wrapper
├── api/                  # Server-side API routes
│   ├── newsletter/       # Newsletter endpoints
│   ├── orders/           # Order processing
│   ├── settings/         # Settings API
│   └── stripe/           # Payment processing
├── catering/             # Catering request page
├── components/           # Reusable React components
├── contexts/             # React Context providers
├── lib/                  # Service layer and utilities
├── socials/              # Social media pages
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Homepage
```

## Key Service Files (app/lib/)
- `firebase.ts` - Firebase client initialization
- `firebase-admin.ts` - Firebase admin SDK
- `products.ts` - Product and order business logic
- `settings.ts` - Application settings management
- `storage.ts` - File upload/storage utilities
- `order-email-service.ts` - Email automation
- `newsletter.ts` - Newsletter functionality
- `auth-middleware.ts` - Authentication utilities
- `rate-limiter.ts` - API rate limiting
- `input-validator.ts` - Input validation utilities