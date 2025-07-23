# Permanent Banner Testing Guide

## Quick Setup Instructions

### 1. Update Firestore Security Rules

In your Firebase Console (https://console.firebase.google.com/):

1. Go to your project → Firestore Database → Rules
2. Add this rule to your existing rules:

```javascript
// Allow read access to settings for everyone, write for admin only
match /settings/{settingId} {
  allow read: if true;
  allow write: if request.auth != null && 
    request.auth.token.email in ['sourthebakeryllc@gmail.com'];
}
```

### 2. Test the Banner

1. **Access the admin panel:**
   - Go to your website `/admin`
   - Login with your admin credentials
   - Click the "Notifications" tab

2. **Create a permanent banner:**
   - Toggle the banner to "Active"
   - Enter a message (e.g., "Fresh sourdough baked daily! Order now for weekend pickup.")
   - Click "Save Settings"

3. **View the banner:**
   - Go to your homepage `/`
   - The banner should appear as a brown bar between the navigation and hero section
   - **Note**: Users cannot dismiss this banner - it stays visible

## Banner Features

- **Position**: Between navigation bar and hero section
- **Colors**: Brown background with cream text
- **Character Limit**: 200 characters maximum
- **Permanent**: Users cannot dismiss the banner
- **Always Visible**: Shows whenever active, perfect for important announcements
- **Admin Controls**: Toggle on/off, edit message, live preview

## Troubleshooting

### Banner Not Showing
1. Check that the banner is set to "Active" in admin panel
2. Verify you have a message entered (cannot be empty)
3. Check browser console for Firebase errors
4. Refresh the homepage to see changes

### Permission Error
1. Ensure Firestore security rules include the `settings` collection rule above
2. Verify your admin email is correctly set in the security rules
3. Try refreshing the admin panel after updating rules

### Testing Updates
1. Change the message in admin panel
2. Save settings
3. Refresh homepage - banner should show new message immediately

## Current Settings

- **Background**: `bg-brown` (dark brown from your theme)
- **Text**: `text-cream` (cream color from your theme)
- **Position**: Home page only, between nav and hero section
- **Behavior**: Permanent (cannot be dismissed by users)
- **Storage**: Firebase `settings/notifications` document