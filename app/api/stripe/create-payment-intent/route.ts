import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// This endpoint is intended to handle POST requests from the frontend and send a POST to Stripe
export async function POST(req: NextRequest) {
  console.log('[DEBUG] POST handler called for /api/stripe/create-payment-intent');
  try {
    console.log('[DEBUG] Request method:', req.method);
    const body = await req.json();
    console.log('[DEBUG] Request body:', body);
    const { items, customerName, customerEmail, customerPhone } = body;

    // Calculate total amount in cents
    const total = items.reduce((sum: number, item: any) => {
      return sum + Math.round(parseFloat(item.price.replace('$', '')) * 100) * item.quantity;
    }, 0);

    // Send POST request to Stripe to create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata: {
        customerName,
        customerPhone,
        items: JSON.stringify(items),
      },
    });

    console.log('[DEBUG] PaymentIntent created:', paymentIntent.id);
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('[DEBUG] Stripe PaymentIntent error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}