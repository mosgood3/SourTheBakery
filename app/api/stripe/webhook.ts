import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrder } from '../../lib/products';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

function getNextSunday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(9, 0, 0, 0); // Set to 9:00 AM
  return nextSunday;
}

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

  console.log('Webhook received:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata || {};
    
    console.log('Processing payment_intent.succeeded:', paymentIntent.id);
    
    try {
      // Validate required metadata
      if (!metadata.customerName || !metadata.customerPhone || !metadata.items) {
        console.error('Missing required metadata for payment intent:', paymentIntent.id);
        return new NextResponse('Missing required metadata', { status: 400 });
      }

      // Parse items safely
      let items;
      try {
        items = JSON.parse(metadata.items);
      } catch (parseError) {
        console.error('Failed to parse items metadata:', parseError);
        return new NextResponse('Invalid items metadata', { status: 400 });
      }

      // Create order with all required fields
      const orderData = {
        customerName: metadata.customerName,
        customerEmail: paymentIntent.receipt_email || '',
        customerPhone: metadata.customerPhone,
        items,
        total: paymentIntent.amount / 100,
        status: 'pending' as const,
        orderDate: serverTimestamp(),
        pickupDate: Timestamp.fromDate(getNextSunday()),
      };
      const orderId = await createOrder(orderData);

      console.log('Order created successfully:', orderId);
      
      // You could also send a confirmation email here
      // await sendOrderConfirmationEmail(paymentIntent.receipt_email, orderId);
      
    } catch (err: any) {
      console.error('Error creating order from webhook:', err);
      
      // Log detailed error for debugging
      console.error('Payment Intent ID:', paymentIntent.id);
      console.error('Customer Email:', paymentIntent.receipt_email);
      console.error('Metadata:', metadata);
      
      return new NextResponse('Order creation failed', { status: 500 });
    }
  }

  // Handle other webhook events if needed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('Payment failed:', paymentIntent.id);
    // You could send a failure notification here
  }

  return new NextResponse('Webhook received', { status: 200 });
} 