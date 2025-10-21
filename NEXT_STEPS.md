# Supabase Migration - Next Steps

## ✅ What's Been Completed

All code has been migrated from Firebase to Supabase:

### Created Files:
- `app/lib/supabase.ts` - Client-side Supabase client
- `app/lib/supabase-server.ts` - Server-side Supabase client
- `app/lib/auth-supabase.ts` - Authentication utilities
- `app/lib/products-supabase.ts` - Products/orders management
- `app/lib/products-server-supabase.ts` - Server-side products/orders
- `app/lib/storage-supabase.ts` - Image storage functions
- `app/lib/settings-supabase.ts` - Settings management
- `app/lib/newsletter-server-supabase.ts` - Newsletter server functions

### Updated Files:
All imports have been updated to use Supabase:
- ✅ `app/contexts/AdminAuthContext.tsx` - Now uses Supabase auth
- ✅ `app/components/ProductsSection.tsx`
- ✅ `app/components/Checkout.tsx`
- ✅ `app/components/OrderStatusBanner.tsx`
- ✅ `app/admin/products/ProductsPanel.tsx`
- ✅ `app/admin/orders/OrdersPanel.tsx`
- ✅ `app/admin/settings/SettingsPanel.tsx`
- ✅ `app/admin/gallery/GalleryPanel.tsx`
- ✅ `app/api/stripe/webhook/route.ts`
- ✅ `app/api/stripe/create-payment-intent/route.ts`
- ✅ `app/api/orders/send-confirmation/route.ts`
- ✅ `app/api/orders/verify/route.ts`
- ✅ `app/api/settings/route.ts`
- ✅ `app/api/newsletter/send/route.ts`

## 🔧 What You Need to Do

### 1. Create Admin User Account

Before you can log in, you need to create your admin account in Supabase:

1. Go to your Supabase Dashboard
2. Click **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: `info@sourthebakery.com` (matches your `NEXT_PUBLIC_ADMIN_EMAIL`)
   - Password: Choose a secure password
   - **IMPORTANT:** Check "Auto Confirm User" (so you don't need email confirmation)
5. Click **Create User**

This account will be able to log into your admin panel.

### 2. Make Storage Bucket Public

Your `images` bucket needs to be publicly accessible. Run this in Supabase SQL Editor:

```sql
-- Make images bucket publicly readable
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### 3. Test the Application

Try these features to ensure everything works:

**Authentication:**
1. Go to `/admin`
2. Log in with: `info@sourthebakery.com` and the password you created
3. You should be able to access the admin dashboard

**Products:**
1. Try adding a new product with an image
2. Try editing a product
3. Try deleting a product (should delete the image too)

**Orders:**
1. Try placing an order from the frontend
2. Check if the order appears in the admin panel
3. Try updating the order status

**Settings:**
1. Go to Settings panel in admin
2. Try updating pickup info
3. Check if changes persist

**Gallery:**
1. Try uploading a gallery image
2. Try deleting a gallery image

### 4. Data Migration (When Ready)

When you're ready to migrate your existing Firebase data:

#### Export from Firebase:
1. Use Firebase Console or Firebase Admin SDK to export your data
2. You'll need to export:
   - Products
   - Orders
   - Settings
   - Newsletter subscribers (if any)

#### Import to Supabase:
I can help you write a migration script, but for now you can manually insert data using Supabase SQL Editor.

**Important Field Name Changes:**
- `customerName` → `customer_name`
- `customerEmail` → `customer_email`
- `weeklyCap` → `weekly_cap`
- `weeklyAmountRemaining` → `weekly_amount_remaining`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `subscribedAt` → `subscribed_at`
- `isActive` → `is_active`

### 5. Migrate Images

Your product images need to be moved from Firebase Storage to Supabase Storage:

1. Download all images from Firebase Storage (in the `products` and `gallery` folders)
2. Upload them to Supabase Storage `images` bucket
3. Update product image URLs in the database to point to the new Supabase URLs

**Supabase Storage URL format:**
```
https://yuscihvpfeuiwesuyouj.supabase.co/storage/v1/object/public/images/products/{filename}
https://yuscihvpfeuiwesuyouj.supabase.co/storage/v1/object/public/images/gallery/{filename}
```

## 🐛 Potential Issues & Fixes

### Issue: "Invalid login credentials"
**Fix:** Make sure you created the user in Supabase Authentication and used "Auto Confirm User"

### Issue: "Access denied. Admin privileges required"
**Fix:** Make sure the email you're logging in with matches `NEXT_PUBLIC_ADMIN_EMAIL` in `.env.local`

### Issue: Images not uploading
**Fix:** Make sure you ran the storage bucket SQL above and the bucket is public

### Issue: Database errors
**Fix:** Make sure you ran the entire `supabase-schema.sql` file without errors

### Issue: Orders not being created by Stripe webhook
**Fix:**
1. Check that your Stripe webhook is pointing to the right URL
2. Check that `STRIPE_WEBHOOK_SECRET` is correctly set
3. Look at the Stripe webhook logs for errors

## 📊 Verify Data Structure

After migrating data, verify your tables have data:

```sql
-- Check products
SELECT COUNT(*) FROM products;

-- Check orders
SELECT COUNT(*) FROM orders;

-- Check settings
SELECT * FROM settings;

-- Check admin users
SELECT * FROM admin_users;
```

## 🧹 Cleanup (After Everything Works)

Once you've verified everything works perfectly, you can clean up Firebase:

1. **Remove Firebase packages:**
```bash
npm uninstall firebase firebase-admin
```

2. **Delete old Firebase files:**
   - `app/lib/firebase.ts`
   - `app/lib/firebase-admin.ts`
   - `app/lib/products.ts`
   - `app/lib/products-server.ts`
   - `app/lib/storage.ts`
   - `app/lib/settings.ts`
   - `app/lib/newsletter.ts`
   - `app/lib/newsletter-server.ts`

3. **Remove Firebase environment variables from `.env.local`:**
   - Remove all `NEXT_PUBLIC_FIREBASE_*` variables
   - Remove `FIREBASE_ADMIN_*` variables

4. **Update `CLAUDE.md`** to reflect Supabase instead of Firebase

## 💡 Need Help?

If you run into issues:

1. Check the browser console for errors
2. Check the Supabase logs (Dashboard → Logs)
3. Check the Next.js server logs
4. Let me know the specific error and I can help debug!

## 🎉 You're Almost Done!

Just complete steps 1-3 above and you should be fully migrated to Supabase!
