# Admin Dashboard Setup Guide

## Overview
The admin dashboard provides secure access to bakery management features. It includes role-based access control and proper error handling.

## Setup Instructions

### 1. Firebase Configuration
Create a `.env.local` file in the root directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Admin Access Configuration
To add admin users, edit the `ADMIN_EMAILS` array in `app/contexts/AdminAuthContext.tsx`:

```typescript
const ADMIN_EMAILS = [
  'admin@sourthebakery.com',
  'owner@sourthebakery.com',
  // Add more admin emails as needed
];
```

### 3. Firebase Authentication Setup
1. Enable Email/Password authentication in your Firebase console
2. Create admin user accounts with the emails listed in `ADMIN_EMAILS`
3. Ensure your Firebase project has the necessary security rules

## Troubleshooting

### Common Issues

#### 1. "Access denied. Admin privileges required."
- **Cause**: User email is not in the `ADMIN_EMAILS` array
- **Solution**: Add the user's email to the `ADMIN_EMAILS` array in `AdminAuthContext.tsx`

#### 2. "Authentication error occurred"
- **Cause**: Firebase configuration issues or network problems
- **Solution**: 
  - Check your `.env.local` file has correct Firebase credentials
  - Verify Firebase project is active and billing is set up
  - Check network connectivity

#### 3. "Login failed. Please try again."
- **Cause**: Invalid email/password or Firebase auth issues
- **Solution**:
  - Verify email and password are correct
  - Check if the user exists in Firebase Authentication
  - Ensure Email/Password auth is enabled in Firebase

#### 4. Dashboard not loading
- **Cause**: Missing dependencies or build issues
- **Solution**:
  - Run `npm install` to ensure all dependencies are installed
  - Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
  - Check browser console for JavaScript errors

#### 5. Styling issues
- **Cause**: Tailwind CSS not properly configured
- **Solution**:
  - Ensure `tailwindcss` is installed: `npm install tailwindcss`
  - Check that `globals.css` is imported in your layout
  - Verify Tailwind configuration in `tailwind.config.js`

### Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Admin Emails**: Keep the admin email list secure and minimal
3. **Firebase Rules**: Set up proper Firestore security rules
4. **HTTPS**: Always use HTTPS in production
5. **Session Management**: Implement proper session timeout

### Performance Optimization

1. **Code Splitting**: The dashboard uses dynamic imports for better performance
2. **Image Optimization**: Use Next.js Image component for product images
3. **Caching**: Implement proper caching strategies for static data
4. **Bundle Analysis**: Use `npm run build` to analyze bundle size

## Features

### Current Features
- ✅ Secure authentication with Firebase
- ✅ Role-based access control
- ✅ Responsive dashboard design
- ✅ Error handling and loading states
- ✅ Accessibility improvements
- ✅ TypeScript support

### Planned Features
- 📋 Orders management interface
- 📋 Products management interface
- 📋 Customer management interface
- 📋 Settings and configuration
- 📋 Real-time data updates
- 📋 Analytics and reporting

## Support

For additional support or feature requests, please contact the development team.

# Admin Authentication Setup Guide

## Overview
This application uses Firebase Authentication to restrict admin access to only pre-created accounts. No user registration is allowed - only the account you create in Firebase Console can access the admin panel.

## Setup Steps

### 1. Create Admin Account in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Enter your admin email and password
6. Click **Add user**

### 2. Update Admin Email in Code

After creating your admin account in Firebase Console, update the `ADMIN_EMAILS` array in `app/contexts/AdminAuthContext.tsx`:

```typescript
const ADMIN_EMAILS: string[] = [
  'your-actual-admin-email@example.com', // Replace with your real admin email
];
```

### 3. Security Features

- **No Registration**: Users cannot create new accounts
- **Email Whitelist**: Only emails in the `ADMIN_EMAILS` array can access admin
- **Pre-validation**: Email is checked before attempting Firebase authentication
- **Double-check**: Admin status is verified after successful login
- **User-friendly Errors**: Clear error messages for different failure scenarios

### 4. Access Admin Panel

1. Navigate to `/admin/login` in your application
2. Use the email and password you created in Firebase Console
3. You'll be redirected to `/admin/dashboard` upon successful login

### 5. Adding Multiple Admins (Optional)

If you need multiple admin accounts, simply:
1. Create additional users in Firebase Console
2. Add their emails to the `ADMIN_EMAILS` array

## Security Notes

- Keep your admin credentials secure
- The admin email list is hardcoded in the application
- No user registration functionality exists
- All authentication goes through Firebase's secure system
- Failed login attempts are logged and rate-limited by Firebase

## Troubleshooting

- **"Access denied" errors**: Make sure the email is in the `ADMIN_EMAILS` array
- **"No account found"**: Verify the account exists in Firebase Console
- **"Incorrect password"**: Check your password in Firebase Console
- **"Too many attempts"**: Wait before trying again (Firebase rate limiting) 