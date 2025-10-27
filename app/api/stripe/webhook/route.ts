import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createOrderServer } from '../../../lib/products-server-supabase';
import { sendOrderConfirmationEmail, sendOrderFailureEmail } from '../../../lib/order-email-service';
import { createRecipePurchase, getRecipe } from '../../../lib/recipes-supabase';
import { sendRecipePurchaseEmail } from '../../../lib/recipe-email-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;


export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Add idempotency check to prevent duplicate processing
  const eventId = event.id;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    if (metadata.type === 'recipe') {
      try {
        const { recipeId, recipeName } = metadata;
        const customerEmail = session.customer_details?.email || '';
        const customerName = session.customer_details?.name || 'Customer';

        if (!recipeId || !customerEmail) {
          return new NextResponse('Missing required metadata', { status: 400 });
        }

        const recipe = await getRecipe(recipeId);
        if (!recipe) {
          return new NextResponse('Recipe not found', { status: 404 });
        }

        await createRecipePurchase({
          recipe_name: recipe.name,
          recipe_id: recipeId,
          customer_name: customerName,
          customer_email: customerEmail,
          price: recipe.price,
          download_url: recipe.pdf_url,
        });

        await sendRecipePurchaseEmail({
          customerName,
          customerEmail,
          recipeName: recipe.name,
          pdfUrl: recipe.pdf_url,
          price: recipe.price,
        });

        return new NextResponse('Recipe purchase processed', { status: 200 });
      } catch (err: any) {
        return new NextResponse('Recipe purchase processing failed', { status: 500 });
      }
    }
  } else if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata || {};

    // Handle recipe purchases
    if (metadata.type === 'recipe') {
      try {
        const { recipeId, recipeName, customerEmail, customerName } = metadata;

        console.log('Processing recipe purchase:', { recipeId, recipeName, customerEmail, customerName });

        if (!recipeId) {
          console.error('Missing recipeId in metadata');
          return new NextResponse('Missing recipeId in metadata', { status: 400 });
        }

        if (!customerEmail) {
          console.error('Missing customerEmail in metadata');
          return new NextResponse('Missing customerEmail in metadata', { status: 400 });
        }

        const recipe = await getRecipe(recipeId);
        if (!recipe) {
          console.error('Recipe not found:', recipeId);
          return new NextResponse('Recipe not found', { status: 404 });
        }

        console.log('Creating recipe purchase record...');
        await createRecipePurchase({
          recipe_name: recipe.name,
          recipe_id: recipeId,
          customer_name: customerName || 'Customer',
          customer_email: customerEmail,
          price: recipe.price,
          download_url: recipe.pdf_url,
        });

        console.log('Sending recipe purchase email to:', customerEmail);
        await sendRecipePurchaseEmail({
          customerName: customerName || 'Customer',
          customerEmail,
          recipeName: recipe.name,
          pdfUrl: recipe.pdf_url,
          price: recipe.price,
        });

        console.log('Recipe purchase processed successfully for:', customerEmail);
        return new NextResponse('Recipe purchase processed successfully', { status: 200 });
      } catch (err: any) {
        console.error('Recipe purchase processing error:', err);
        console.error('Error stack:', err.stack);
        return new NextResponse(`Recipe purchase processing failed: ${err.message}`, { status: 500 });
      }
    }

    // Declare variables outside try block for catch block access
    let items, pickupInfo;
    
    try {
      // Validate required metadata
      if (!metadata.customerName || !metadata.items || !metadata.pickupInfo) {
        return new NextResponse('Missing required metadata', { status: 400 });
      }

      // Parse items and pickup info safely
      try {
        items = JSON.parse(metadata.items);
        pickupInfo = JSON.parse(metadata.pickupInfo);
      } catch (parseError) {
        return new NextResponse('Invalid metadata', { status: 400 });
      }

      // Create pickup date from metadata (use timeStart for the timestamp)
      const pickupDateTime = new Date(`${pickupInfo.date}T${pickupInfo.timeStart || pickupInfo.time}-05:00`);
      
      // Map items to match expected format (id -> productId, name -> productName)
      const mappedItems = items.map((item: any) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      // Create order with all required fields using server-side function
      const orderData = {
        customerName: metadata.customerName,
        customerEmail: paymentIntent.receipt_email || '',
        items: mappedItems,
        total: paymentIntent.amount / 100,
        status: 'open' as const,
        pickupDate: pickupDateTime.toISOString()
      };
      const orderId = await createOrderServer(orderData);

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          ...orderData,
          orderId,
          orderDate: new Date(), // Add orderDate for email template
          pickupDate: pickupDateTime // Use the actual pickup date for email
        });
      } catch (emailError) {
        // Don't fail the webhook if email fails - order was still created successfully
      }

    } catch (err: any) {
      // Only send failure email for critical errors, not temporary issues
      const isTemporaryError = err.message.includes('weekly limit') || 
                               err.message.includes('Database service not available') ||
                               err.message.includes('timeout') ||
                               err.message.includes('UNAVAILABLE');
      
      if (!isTemporaryError) {
        // Send failure email to customer only for non-temporary errors
        try {
          await sendOrderFailureEmail(
            metadata.customerName,
            paymentIntent.receipt_email || '',
            paymentIntent.id
          );
        } catch (emailError) {
          // Don't fail the webhook if failure email fails
        }
      } else {
        // For temporary errors, we should retry or handle gracefully
        // Return 500 so Stripe retries the webhook
      }
      
      return new NextResponse('Order creation failed', { status: 500 });
    }
  }

  // Handle other webhook events if needed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // You could send a failure notification here
  }

  return new NextResponse('Webhook received', { status: 200 });
} 