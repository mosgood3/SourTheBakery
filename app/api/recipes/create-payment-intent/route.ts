import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipeId, recipeName, price } = body;

    // Validate required fields
    if (!recipeId || !recipeName || !price) {
      return NextResponse.json(
        { error: 'Recipe ID, name, and price are required' },
        { status: 400 }
      );
    }

    // Parse price (remove $ symbol and convert to cents)
    const priceInCents = Math.round(parseFloat(price.replace('$', '')) * 100);

    if (isNaN(priceInCents) || priceInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid price format' },
        { status: 400 }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInCents,
      currency: 'usd',
      metadata: {
        recipeId,
        recipeName,
        type: 'recipe',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('Stripe PaymentIntent error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
