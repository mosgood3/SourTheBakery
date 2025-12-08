import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientSecret, customerEmail, customerName } = body;

    // Validate required fields
    if (!clientSecret || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Client secret, customer email, and name are required' },
        { status: 400 }
      );
    }

    // Extract payment intent ID from client secret
    // Client secret format: pi_xxxxx_secret_yyyyy
    const paymentIntentId = clientSecret.split('_secret_')[0];

    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json(
        { error: 'Invalid client secret format' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to get existing metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update the payment intent with customer details
    await stripe.paymentIntents.update(paymentIntentId, {
      receipt_email: customerEmail,
      metadata: {
        ...paymentIntent.metadata,
        customerEmail,
        customerName,
      },
    });

    console.log('Payment intent updated successfully:', paymentIntentId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update payment intent error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
