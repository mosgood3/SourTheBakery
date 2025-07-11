import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../lib/firebaseServer';
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// This endpoint is intended to handle POST requests from the frontend and send a POST to Stripe
export async function POST(req: NextRequest) {
  console.log('[DEBUG] POST handler called for /api/stripe/create-payment-intent');
  try {
    console.log('[DEBUG] Request method:', req.method);
    const body = await req.json();
    console.log('[DEBUG] Request body:', body);
    const { items, customerName, customerEmail, customerPhone } = body;

    // Fetch authoritative prices from Firestore and calculate total
    const pricedItems = [] as { productId: string; productName: string; quantity: number; price: string }[];
    let total = 0;

    for (const item of items) {
      const docRef = doc(db, 'products', item.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Product not found: ${item.id}`);
      }
      const data = snap.data() as { name: string; price: string };
      const priceNum = parseFloat(data.price.replace('$', ''));
      total += Math.round(priceNum * 100) * item.quantity;
      pricedItems.push({
        productId: item.id,
        productName: data.name,
        quantity: item.quantity,
        price: data.price,
      });
    }

    // Send POST request to Stripe to create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      receipt_email: customerEmail,
      metadata: {
        customerName,
        customerPhone,
        items: JSON.stringify(pricedItems),
      },
    });

    console.log('[DEBUG] PaymentIntent created:', paymentIntent.id);
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('[DEBUG] Stripe PaymentIntent error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}