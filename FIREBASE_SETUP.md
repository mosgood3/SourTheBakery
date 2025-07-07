# Firebase Firestore & Storage Setup Guide

## Overview
This guide will help you set up Firebase Firestore to store your bakery products and Firebase Storage for product images. The products will be managed through the admin panel and displayed on your website.

## Step 1: Enable Firestore Database

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**
3. **Navigate to Firestore Database** in the left sidebar
4. **Click "Create Database"**
5. **Choose security mode:**
   - Select **"Start in test mode"** for development
   - Click **"Next"**
6. **Choose location:**
   - Select a location close to your users (e.g., `us-central1` for US)
   - Click **"Done"**

## Step 2: Enable Firebase Storage

1. **Navigate to Storage** in the left sidebar
2. **Click "Get Started"**
3. **Choose security mode:**
   - Select **"Start in test mode"** for development
   - Click **"Next"**
4. **Choose location:**
   - Select the same location as your Firestore database
   - Click **"Done"**

## Step 3: Set Up Firestore Security Rules

1. **Go to Firestore Database** → **Rules** tab
2. **Replace the default rules with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to products for everyone
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['sourthebakeryllc@gmail.com'];
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"**

## Step 4: Set Up Storage Security Rules

1. **Go to Storage** → **Rules** tab
2. **Replace the default rules with:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['sourthebakeryllc@gmail.com'];
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"**

## Step 5: Create Sample Products (Optional)

You can add some sample products to test the system:

1. **Go to Firestore Database** → **Data** tab
2. **Click "Start collection"**
3. **Collection ID:** `products`
4. **Add documents with these fields:**

### Sample Product 1:
```json
{
  "name": "Sourdough Bread",
  "description": "Artisanal sourdough bread made with traditional techniques",
  "price": "$6.50",
  "image": "https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/products%2F1234567890_sourdough.jpg?alt=media&token=...",
  "createdAt": [server timestamp],
  "updatedAt": [server timestamp]
}
```

### Sample Product 2:
```json
{
  "name": "Brownies",
  "description": "Fudgy chocolate brownies with rich cocoa flavor",
  "price": "$4.50",
  "image": "https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/products%2F1234567891_brownies.jpg?alt=media&token=...",
  "createdAt": [server timestamp],
  "updatedAt": [server timestamp]
}
```

## Step 6: Test the System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit your website** - products should load from Firebase

3. **Test admin access:**
   - Go to `/admin/login`
   - Login with your admin credentials
   - Go to `/admin/products` to manage products
   - Try uploading a new product with an image

## Step 7: Production Security Rules

For production, update both Firestore and Storage rules to be more restrictive:

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to products for everyone
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['sourthebakeryllc@gmail.com'] &&
        request.resource.data.keys().hasAll(['name', 'description', 'price', 'image']) &&
        request.resource.data.name is string &&
        request.resource.data.description is string &&
        request.resource.data.price is string &&
        request.resource.data.image is string;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['sourthebakeryllc@gmail.com'] &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB max
        request.resource.contentType.matches('image/.*');
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Troubleshooting

### Products Not Loading
- Check browser console for errors
- Verify Firebase configuration in `.env.local`
- Ensure Firestore is enabled and rules allow read access

### Images Not Uploading
- Check browser console for errors
- Verify Firebase Storage is enabled
- Ensure Storage rules allow write access for admin
- Check that image file is under 5MB and is a valid image type

### Admin Can't Add/Edit Products
- Verify admin email is in the security rules
- Check that you're logged in as admin
- Ensure Firestore rules allow write access for admin

### Image Upload Issues
- Make sure the image file is less than 5MB
- Supported formats: JPEG, PNG, WebP
- Check browser console for specific error messages

## Data Structure

Each product document contains:
- `name` (string): Product name
- `description` (string): Product description
- `price` (string): Price with currency symbol
- `image` (string): Firebase Storage download URL
- `createdAt` (timestamp): When product was created
- `updatedAt` (timestamp): When product was last updated

## Cost Considerations

### Firestore:
- **Free Tier:** 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day
- **Paid Tier:** $0.06 per 100,000 reads, $0.18 per 100,000 writes

### Storage:
- **Free Tier:** 5GB storage, 1GB downloads/day
- **Paid Tier:** $0.026 per GB/month storage, $0.12 per GB downloads

For a small bakery, the free tier should be sufficient for both services. 