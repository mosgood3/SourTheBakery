import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrder } from '../../lib/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata || {};
    try {
      // You may want to store more info, e.g. items, by passing them as metadata
      await createOrder({
        customerName: metadata.customerName || '',
        customerEmail: paymentIntent.receipt_email || '',
        customerPhone: metadata.customerPhone || '',
        items: JSON.parse(metadata.items || '[]'),
        total: paymentIntent.amount / 100,
        status: 'pending',
      });
    } catch (err: any) {
      console.error('Error creating order from webhook:', err);
      return new NextResponse('Order creation failed', { status: 500 });
    }
  }

  return new NextResponse('Webhook received', { status: 200 });
} 