import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkWeeklyCap } from '../../../lib/products-supabase';
import { createRateLimitedHandler } from '../../../lib/rate-limiter';
import { validateEmail } from '../../../lib/input-validator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// This endpoint is intended to handle POST requests from the frontend and send a POST to Stripe
async function handleCreatePaymentIntent(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] POST handler called for /api/stripe/create-payment-intent');
  }
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Request method:', req.method);
    }
    const body = await req.json();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] Request body:', body);
    }
    const { items, customerName, customerEmail, pickupInfo } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!validateEmail(customerEmail)) {
      return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400 });
    }

    // Check inventory availability for all items BEFORE processing payment
    for (const item of items) {
      try {
        const capCheck = await checkWeeklyCap(item.id, item.quantity);
        if (!capCheck.available) {
          return NextResponse.json({ 
            error: `${item.name} has reached its weekly limit. Only ${capCheck.remaining} available this week.` 
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error checking weekly cap for item:', item.id, error);
        return NextResponse.json({ 
          error: `Unable to verify availability for ${item.name}. Please try again.` 
        }, { status: 500 });
      }
    }

    // Calculate total amount in cents
    const total = items.reduce((sum: number, item: any) => {
      return sum + Math.round(parseFloat(item.price.replace('$', '')) * 100) * item.quantity;
    }, 0);

    // Create simplified items for metadata (remove long URLs and descriptions)
    const simplifiedItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Send POST request to Stripe to create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata: {
        customerName,
        items: JSON.stringify(simplifiedItems),
        pickupInfo: JSON.stringify(pickupInfo),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] PaymentIntent created:', paymentIntent.id);
    }
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('[DEBUG] Stripe PaymentIntent error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Apply rate limiting
export const POST = createRateLimitedHandler(handleCreatePaymentIntent, {
  requests: 10, // Max 10 payment intent requests
  window: 60000, // Per minute
  blockDuration: 120000 // Block for 2 minutes
});