import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRateLimitedHandler } from '../../../lib/rate-limiter';
import { validateEmail } from '../../../lib/input-validator';
import { createPendingOrder } from '../../../lib/pickups-server-supabase';
import { getPickup, isPickupOrderWindowOpen, checkPickupInventory } from '../../../lib/pickups-supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-11-17.clover',
});

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
    const { items, customerName, customerEmail, pickupId } = body;

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

    if (!pickupId || typeof pickupId !== 'string') {
      return NextResponse.json({ error: 'Pickup ID is required' }, { status: 400 });
    }

    // Validate pickup exists and is active
    const pickup = await getPickup(pickupId);
    if (!pickup) {
      return NextResponse.json({ error: 'Pickup event not found' }, { status: 404 });
    }

    const isOrderWindowOpen = await isPickupOrderWindowOpen(pickupId);
    if (!isOrderWindowOpen) {
      return NextResponse.json({ error: 'The order window for this pickup has closed' }, { status: 400 });
    }

    // Check inventory availability for all items BEFORE processing payment
    for (const item of items) {
      try {
        const inventoryCheck = await checkPickupInventory(pickupId, item.id, item.quantity);
        if (!inventoryCheck.available) {
          return NextResponse.json({
            error: `${item.name} does not have enough inventory. Only ${inventoryCheck.remaining} available for this pickup.`
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error checking pickup inventory for item:', item.id, error);
        return NextResponse.json({
          error: `Unable to verify availability for ${item.name}. Please try again.`
        }, { status: 500 });
      }
    }

    // Calculate total amount in cents
    const total = items.reduce((sum: number, item: any) => {
      return sum + Math.round(parseFloat(item.price.replace('$', '')) * 100) * item.quantity;
    }, 0);

    // Create simplified items for pending order (remove long URLs and descriptions)
    const simplifiedItems = items.map((item: any) => ({
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Save order details to Supabase pending_orders table to avoid Stripe metadata limits
    const pendingOrderId = await createPendingOrder({
      customerName,
      customerEmail,
      items: simplifiedItems,
      pickupId,
      pickupInfo: {
        date: pickup.pickup_date,
        timeStart: pickup.pickup_time_start,
        timeEnd: pickup.pickup_time_end,
        location: pickup.pickup_location
      }
    });

    // Send POST request to Stripe to create a PaymentIntent
    // Only pass the pending order ID to avoid metadata size limits
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata: {
        pendingOrderId,
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