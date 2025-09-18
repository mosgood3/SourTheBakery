# Troubleshooting Guide

## Common Issues & Solutions

### Environment Setup
**Issue**: Firebase connection errors
- Check all Firebase environment variables in `.env.local`
- Verify Firebase project configuration
- Ensure Firebase services are enabled (Auth, Firestore, Storage)

**Issue**: Admin access denied
- Verify `NEXT_PUBLIC_ADMIN_UID` matches authenticated user's UID
- Check Firebase Auth is working properly
- Ensure admin user exists in Firebase console

### Development Server
**Issue**: Build errors with TypeScript
- Run `npm run lint` to check for linting issues
- Check for missing type definitions
- Verify all imports are correct

**Issue**: Tailwind styles not applying
- Check `tailwind.config.js` configuration
- Verify Tailwind CSS 4 setup is correct
- Clear Next.js cache: `rm -rf .next`

### Payment Processing
**Issue**: Stripe webhook failures
- Verify `STRIPE_WEBHOOK_SECRET` is correctly set
- Check webhook endpoint URL in Stripe dashboard
- Ensure webhook events are properly configured

**Issue**: Order creation failures
- Check order window timing restrictions
- Verify product inventory availability
- Check Firebase Firestore rules

### Email Issues
**Issue**: AWS SES email failures
- Verify AWS credentials and region settings
- Check SES service status and sending limits
- Ensure email addresses are verified in SES

### Database Issues
**Issue**: Firestore permission errors
- Check `firestore.rules` configuration
- Verify user authentication status
- Review Firestore security rules in Firebase console

**Issue**: Weekly inventory not updating
- Check product `weeklyCap` and `weeklyAmountRemaining` values
- Verify order processing logic in `createOrder`
- Use admin function `resetWeeklyAmounts()` to reset

## Debugging Tips
1. Check browser console for client-side errors
2. Review Next.js server logs for API route issues
3. Use Firebase console to inspect database state
4. Test Stripe webhooks with Stripe CLI
5. Verify environment variables are loaded correctly

## Performance Considerations
- Use React.memo for expensive components
- Implement proper image optimization
- Monitor Firebase usage and costs
- Consider implementing caching for frequently accessed data