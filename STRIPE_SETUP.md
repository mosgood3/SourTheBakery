# Stripe Setup Instructions

Follow these steps to configure Stripe for your bakery app with embedded checkout and webhook order creation.

## 1. Create a Stripe Account
- Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) and create a free account if you don't have one.

## 2. Get Your API Keys
- In the Stripe Dashboard, go to **Developers > API keys**.
- Copy your **Publishable key** and **Secret key**.

## 3. Set Environment Variables
Add the following to your `.env.local` file in the project root:

```
# Stripe API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Your app's base URL (for Stripe Checkout, if used)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe webhook secret (see below)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Set Up the Webhook Endpoint
- In the Stripe Dashboard, go to **Developers > Webhooks**.
- Click **Add endpoint**.
- Set the endpoint URL to:
  - For local development: `http://localhost:3000/api/stripe/webhook`
  - For production: `https://yourdomain.com/api/stripe/webhook`
- Select the event: `payment_intent.succeeded`
- After creating the webhook, copy the **Signing secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## 5. (Optional) Test Webhooks Locally
- Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
- Run:
  ```sh
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- This will forward live Stripe events to your local server.

## 6. Recommended Stripe Dashboard Settings
- Set your business information, branding, and support email in **Settings > Branding**.
- Enable test mode for development.
- Add your products/pricing if you want to use Stripe's product catalog (optional).

## 7. Go Live
- When ready, switch your API keys and webhook to live mode in the Stripe Dashboard.

---

**If you have any issues, check the Stripe logs in the Dashboard or use the Stripe CLI for debugging.** 