# Supabase Migration Guide

## What's Been Done

### ✅ Completed Steps

1. **Supabase Setup**
   - Created Supabase project
   - Added environment variables to `.env.local`
   - Created database schema (`supabase-schema.sql`)
   - Executed SQL schema in Supabase
   - Created `images` bucket in Supabase Storage

2. **Installed Dependencies**
   - `@supabase/supabase-js` package installed

3. **Created Supabase Client Files**
   - `app/lib/supabase.ts` - Client-side Supabase client
   - `app/lib/supabase-server.ts` - Server-side Supabase client (with service role)

4. **Created Migrated Library Files**
   - `app/lib/products-supabase.ts` - Products and orders management
   - `app/lib/products-server-supabase.ts` - Server-side products/orders
   - `app/lib/storage-supabase.ts` - Image upload/delete functions
   - `app/lib/settings-supabase.ts` - Settings management

## Next Steps

### 1. Configure Storage Bucket

Go to your Supabase dashboard > Storage > `images` bucket and set it to **public**:

```sql
-- Run this in Supabase SQL Editor to make the images bucket public
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### 2. Update File Imports

You need to replace Firebase imports with Supabase imports throughout your codebase. Here's what needs to change:

#### Files to Update:

**Components:**
- `app/admin/products/ProductsPanel.tsx`
- `app/admin/orders/OrdersPanel.tsx`
- `app/admin/gallery/GalleryPanel.tsx`
- `app/admin/settings/SettingsPanel.tsx`
- Any other components using Firebase

**API Routes:**
- `app/api/stripe/webhook/route.ts`
- `app/api/orders/send-confirmation/route.ts`
- `app/api/orders/verify/route.ts`
- `app/api/settings/route.ts`
- `app/api/newsletter/send/route.ts`

**Contexts:**
- `app/contexts/AdminAuthContext.tsx`

#### Import Changes:

**Before (Firebase):**
```typescript
import { getProducts, addProduct, updateProduct, deleteProduct } from '../lib/products';
import { uploadImage, deleteImage } from '../lib/storage';
import { getSettings, updateSettings } from '../lib/settings';
```

**After (Supabase):**
```typescript
import { getProducts, addProduct, updateProduct, deleteProduct } from '../lib/products-supabase';
import { uploadImage, deleteImage } from '../lib/storage-supabase';
import { getSettings, updateSettings } from '../lib/settings-supabase';
```

**For Server-side API routes:**
```typescript
// Before
import { createOrderServer } from '../../../lib/products-server';

// After
import { createOrderServer } from '../../../lib/products-server-supabase';
```

### 3. Authentication Migration

Your current admin authentication uses Firebase Auth with UID-based access. For Supabase, you have two options:

**Option A: Email/Password Auth (Recommended)**
- Admin logs in with email/password
- Check if email exists in `admin_users` table
- Simpler and more secure

**Option B: Keep UID-based (requires custom setup)**
- Would need to migrate Firebase UIDs to Supabase
- More complex

**I recommend Option A.** Let me know if you want me to implement the auth migration.

### 4. Data Migration

You need to export your existing Firebase data and import it to Supabase:

#### Export from Firebase:
1. Go to Firebase Console > Firestore Database
2. Export each collection:
   - `products`
   - `orders`
   - `settings`
   - `notifications` (if any)
   - `newsletter_subscribers` (if any)

#### Import to Supabase:
1. Convert Firebase documents to match Supabase schema
2. Use Supabase SQL Editor or API to insert data

**Note:** Field name changes:
- Firebase uses camelCase: `createdAt`, `customerName`
- Supabase uses snake_case: `created_at`, `customer_name`

### 5. Image Migration

Your product images in Firebase Storage need to be migrated to Supabase Storage:

1. Download all images from Firebase Storage
2. Upload them to Supabase Storage `images` bucket
3. Update product image URLs in the database

### 6. Testing Checklist

After making the changes, test these features:

- [ ] View products on homepage
- [ ] Admin: Add new product with image
- [ ] Admin: Update product
- [ ] Admin: Delete product (should delete image too)
- [ ] Create an order (test Stripe webhook)
- [ ] View orders in admin
- [ ] Update order status
- [ ] Check order window settings
- [ ] Upload gallery images
- [ ] Delete gallery images
- [ ] Newsletter subscription

### 7. Cleanup (After Everything Works)

Once Supabase is fully working, you can:

1. Remove Firebase dependencies:
```bash
npm uninstall firebase firebase-admin
```

2. Delete old Firebase files:
   - `app/lib/firebase.ts`
   - `app/lib/firebase-admin.ts`
   - `app/lib/products.ts`
   - `app/lib/products-server.ts`
   - `app/lib/storage.ts`
   - `app/lib/settings.ts`

3. Remove Firebase environment variables from `.env.local`

4. Update `CLAUDE.md` to reflect Supabase instead of Firebase

## Important Notes

### Database Differences

**Timestamps:**
- Firebase: Uses `serverTimestamp()` function
- Supabase: Uses PostgreSQL `NOW()` or ISO strings

**IDs:**
- Firebase: Random alphanumeric strings
- Supabase: UUIDs

**Nested Data:**
- Firebase: Supports nested objects
- Supabase: Use JSONB for nested data (like order items)

### Row Level Security (RLS)

Your Supabase tables have RLS policies enabled. Make sure your client code uses authenticated requests where needed, or use the service role key for server-side operations (already set up in `supabase-server.ts`).

## Need Help?

If you encounter issues during migration:

1. **Authentication not working**: Let me know and I'll help set up Supabase Auth
2. **Data import issues**: I can help write migration scripts
3. **Storage errors**: Check bucket permissions and policies
4. **Query errors**: Supabase uses PostgreSQL, syntax might differ from Firestore

Let me know when you're ready to proceed with the next steps!
