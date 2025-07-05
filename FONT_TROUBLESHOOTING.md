# Font Troubleshooting Guide

## Issue: Font file not found

### Problem
```
Font file not found: Can't resolve './fonts/Epilogue-Variable.woff2'
```

### Solution Applied
The missing font files have been replaced with Google Fonts for better reliability and performance.

### Changes Made

1. **Updated `app/layout.tsx`**:
   - Replaced `localFont` imports with Google Fonts
   - Removed missing Epilogue font
   - Used `Inter` and `Playfair_Display` from Google Fonts

2. **Updated `app/globals.css`**:
   - Removed reference to missing Epilogue font
   - Updated heading styles to use available fonts

### Benefits of Google Fonts

✅ **Reliability**: No missing font files
✅ **Performance**: Optimized loading and caching
✅ **Maintenance**: No need to manage font files locally
✅ **CDN**: Fast global delivery
✅ **Automatic optimization**: Next.js handles font optimization

### Alternative Solutions

If you prefer to use local fonts:

1. **Create fonts directory**:
   ```bash
   mkdir app/fonts
   ```

2. **Download font files**:
   - Inter: https://fonts.google.com/specimen/Inter
   - Playfair Display: https://fonts.google.com/specimen/Playfair+Display
   - Epilogue: https://fonts.google.com/specimen/Epilogue

3. **Update layout.tsx**:
   ```typescript
   import localFont from "next/font/local";
   
   const inter = localFont({
     src: "./fonts/Inter-Variable.woff2",
     variable: "--font-inter",
     display: "swap",
   });
   ```

### Current Font Configuration

- **Sans-serif**: Inter (Google Fonts)
- **Serif**: Playfair Display (Google Fonts)
- **Fallbacks**: Arial, Helvetica, Georgia

### Testing

After the changes, your application should:
- Load without font errors
- Display proper typography
- Have consistent font rendering across browsers

### Performance Notes

Google Fonts are automatically optimized by Next.js:
- Fonts are preloaded
- CSS is inlined for critical fonts
- Font display is set to "swap" for better performance
- Fonts are cached by the browser

If you experience any font-related issues, check:
1. Network connectivity
2. Browser console for errors
3. Font loading in browser dev tools 