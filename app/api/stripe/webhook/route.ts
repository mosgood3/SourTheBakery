import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrder } from '../../../lib/products';
import { sendOrderConfirmationEmail, sendOrderFailureEmail } from '../../../lib/order-email-service';
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

  if (process.env.NODE_ENV !== 'production') {
    console.log('Webhook received:', event.type);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata || {};
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Processing payment_intent.succeeded:', paymentIntent.id);
    }
    
    // Declare variables outside try block for catch block access
    let items, pickupInfo;
    
    try {
      // Validate required metadata
      if (!metadata.customerName || !metadata.items || !metadata.pickupInfo) {
        console.error('Missing required metadata for payment intent:', paymentIntent.id);
        return new NextResponse('Missing required metadata', { status: 400 });
      }

      // Parse items and pickup info safely
      try {
        items = JSON.parse(metadata.items);
        pickupInfo = JSON.parse(metadata.pickupInfo);
      } catch (parseError) {
        console.error('Failed to parse metadata:', parseError);
        console.error('Raw metadata.items:', metadata.items);
        console.error('Raw metadata.pickupInfo:', metadata.pickupInfo);
        return new NextResponse('Invalid metadata', { status: 400 });
      }

      // Create pickup date from metadata
      const pickupDateTime = new Date(`${pickupInfo.date}T${pickupInfo.time}`);
      
      // Map items to match expected format (id -> productId, name -> productName)
      const mappedItems = items.map((item: any) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      // Create order with all required fields
      const orderData = {
        customerName: metadata.customerName,
        customerEmail: paymentIntent.receipt_email || '',
        items: mappedItems,
        total: paymentIntent.amount / 100,
        status: 'open' as const,
        orderDate: serverTimestamp(),
        pickupDate: Timestamp.fromDate(pickupDateTime),
      };
      const orderId = await createOrder(orderData);

      if (process.env.NODE_ENV !== 'production') {
        console.log('Order created successfully:', orderId);
      }
      
      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          ...orderData,
          orderId
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('Order confirmation email sent for order:', orderId);
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email for order', orderId, ':', emailError);
        // Don't fail the webhook if email fails - order was still created successfully
      }
      
    } catch (err: any) {
      console.error('Error creating order from webhook:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Log detailed error for debugging
      console.error('Payment Intent ID:', paymentIntent.id);
      console.error('Customer Email:', paymentIntent.receipt_email);
      console.error('Metadata:', metadata);
      console.error('Parsed pickup info:', pickupInfo);
      console.error('Order data that failed:', {
        customerName: metadata.customerName,
        customerEmail: paymentIntent.receipt_email,
        items,
        total: paymentIntent.amount / 100,
        status: 'open',
        pickupDateTime: pickupInfo ? new Date(`${pickupInfo.date}T${pickupInfo.time}`) : 'MISSING'
      });
      
      // Send failure email to customer
      try {
        await sendOrderFailureEmail(
          metadata.customerName,
          paymentIntent.receipt_email || '',
          paymentIntent.id
        );
        console.log('Order failure email sent for payment:', paymentIntent.id);
      } catch (emailError) {
        console.error('Failed to send order failure email:', emailError);
        // Don't fail the webhook if failure email fails
      }
      
      return new NextResponse('Order creation failed', { status: 500 });
    }
  }

  // Handle other webhook events if needed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Payment failed:', paymentIntent.id);
    }
    // You could send a failure notification here
  }

  return new NextResponse('Webhook received', { status: 200 });
} 