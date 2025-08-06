# Security Setup Guide

## Environment Variables Required

Add these to your `.env.local` file for the security improvements to work:

```env
# Firebase Admin SDK (for server-side authentication)
FIREBASE_ADMIN_CLIENT_EMAIL=your-firebase-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Existing environment variables (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_ADMIN_UID=your-admin-user-uid
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
SES_FROM_EMAIL=your-sender-email
SES_REPLY_TO_EMAIL=your-reply-email
```

## Firebase Admin Setup

1. Go to the Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the `client_email` and `private_key` fields
5. Add them to your environment variables

## Security Features Implemented

### 1. Authentication Middleware
- All admin APIs now require Firebase authentication
- Only users with the configured admin UID can access admin endpoints
- JWT token validation on server-side

### 2. Rate Limiting
- Newsletter API: 5 requests per minute
- Order confirmation API: 10 requests per minute
- Order verification API: 5 requests per minute
- Payment intent API: 10 requests per minute
- Automatic IP-based blocking for violations

### 3. Input Validation & Sanitization
- DOMPurify for HTML content sanitization
- HTML escaping for all email templates
- Email format validation
- Order data structure validation
- Field length limits and type checking

### 4. Firestore Security Rules
Updated rules with:
- Field-level restrictions
- Data validation functions
- Proper admin authentication checks
- Inventory update limitations

### 5. Enhanced Error Handling
- Detailed logging with user context
- Sanitized error messages to prevent information leakage
- Rate limit headers for client guidance

## API Changes

### Newsletter Send API (`/api/newsletter/send`)
- **BREAKING CHANGE**: Now requires admin authentication
- Add `Authorization: Bearer <firebase-jwt-token>` header
- Content is automatically sanitized with DOMPurify

### Order Confirmation API (`/api/orders/send-confirmation`)
- **BREAKING CHANGE**: Now requires admin authentication
- Add `Authorization: Bearer <firebase-jwt-token>` header
- Enhanced input validation

### All APIs
- Rate limiting applied
- Enhanced error responses
- Input validation and sanitization

## Testing the Security

```javascript
// Example of how to call protected APIs from admin frontend
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  
  const response = await fetch('/api/newsletter/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      subject: 'Test Newsletter',
      content: '<p>Hello subscribers!</p>',
      sentBy: 'Admin User'
    })
  });
}
```

## Deployment Checklist

1. ✅ Deploy updated Firestore security rules
2. ✅ Add Firebase Admin environment variables
3. ✅ Update admin frontend to include authentication headers
4. ✅ Test all admin APIs with authentication
5. ✅ Monitor rate limiting logs
6. ✅ Verify email templates render safely

## Security Monitoring

The enhanced error logging will help monitor:
- Failed authentication attempts
- Rate limiting violations
- Input validation failures
- Unusual API usage patterns

Check your application logs regularly for security events.