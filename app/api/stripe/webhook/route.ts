import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  createOrderWithPickup,
  getPendingOrder,
  deletePendingOrder,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  cleanupOldPendingOrders
} from '../../../lib/pickups-server-supabase';
import { sendOrderConfirmationEmail, sendOrderFailureEmail } from '../../../lib/order-email-service';
import { getRecipe } from '../../../lib/recipes-supabase';
import { createRecipePurchaseServer } from '../../../lib/recipes-server-supabase';
import { sendRecipePurchaseEmail } from '../../../lib/recipe-email-service';
import { getPickup } from '../../../lib/pickups-supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-11-17.clover',
});
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

  const eventId = event.id;

  // Idempotency check - skip if already processed
  const alreadyProcessed = await isWebhookEventProcessed(eventId);
  if (alreadyProcessed) {
    console.log('Webhook event already processed, skipping:', eventId);
    return new NextResponse('Event already processed', { status: 200 });
  }

  // Opportunistically cleanup old pending orders (non-blocking)
  cleanupOldPendingOrders(30).catch(err => {
    console.error('Background cleanup failed:', err);
  });

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

        await createRecipePurchaseServer({
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

        // Mark event as processed
        await markWebhookEventProcessed(eventId, event.type);
        return new NextResponse('Recipe purchase processed', { status: 200 });
      } catch (err: any) {
        return new NextResponse('Recipe purchase processing failed', { status: 500 });
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
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
        await createRecipePurchaseServer({
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

        // Mark event as processed
        await markWebhookEventProcessed(eventId, event.type);
        console.log('Recipe purchase processed successfully for:', customerEmail);
        return new NextResponse('Recipe purchase processed successfully', { status: 200 });
      } catch (err: any) {
        console.error('Recipe purchase processing error:', err);
        console.error('Error stack:', err.stack);
        return new NextResponse(`Recipe purchase processing failed: ${err.message}`, { status: 500 });
      }
    }

    // Initialize variables with safe defaults for error handling
    let items: any[] = [];
    let pickupId: string | undefined;
    let customerName: string = 'Customer';
    let customerEmail: string = '';
    let pickup: any = null;

    try {
      // Idempotency check: if order already exists for this payment intent, return success
      const existingOrder = await getOrderByPaymentIntent(paymentIntent.id);
      if (existingOrder) {
        console.log('Order already exists for payment intent:', paymentIntent.id, '- skipping (idempotent)');
        return new NextResponse('Order already processed', { status: 200 });
      }

      // Fetch pending order from Supabase using the ID from metadata
      if (!metadata.pendingOrderId) {
        return new NextResponse('Missing pending order ID in metadata', { status: 400 });
      }

      const pendingOrder = await getPendingOrder(metadata.pendingOrderId);
      if (!pendingOrder) {
        return new NextResponse('Pending order not found', { status: 400 });
      }

      // Extract data from pending order
      items = pendingOrder.items;
      pickupId = pendingOrder.pickupId;
      customerName = pendingOrder.customerName;
      customerEmail = pendingOrder.customerEmail;

      // Validate pickup exists
      if (!pickupId) {
        console.error('Missing pickup ID in pending order - this is a legacy order without pickup data', {
          pendingOrderId: metadata.pendingOrderId,
          customerEmail
        });

        // Send failure email to customer
        try {
          await sendOrderFailureEmail(
            customerName || 'Customer',
            customerEmail || paymentIntent.receipt_email || '',
            paymentIntent.id
          );
        } catch (emailError) {
          console.error('Failed to send failure email:', emailError);
        }

        return new NextResponse('Missing pickup ID in pending order - legacy order cannot be processed', { status: 400 });
      }

      pickup = await getPickup(pickupId);
      if (!pickup) {
        return new NextResponse('Pickup event not found', { status: 404 });
      }

      // Create pickup date from pickup data
      const pickupDateTime = new Date(`${pickup.pickup_date}T${pickup.pickup_time_start}`);

      // Items from pending order already have correct format (productId, productName, etc.)
      const mappedItems = items;

      // Create order with all required fields using pickup-specific function
      const orderData = {
        customerName,
        customerEmail,
        items: mappedItems,
        total: paymentIntent.amount / 100,
        status: 'open' as const,
        pickupDate: pickupDateTime.toISOString(),
        paymentIntentId: paymentIntent.id
      };
      const orderId = await createOrderWithPickup(orderData, pickupId);

      // Delete the pending order after successfully creating the final order
      await deletePendingOrder(metadata.pendingOrderId);

      // Send order confirmation email with pickup details
      try {
        await sendOrderConfirmationEmail({
          ...orderData,
          orderId,
          orderDate: new Date(),
          pickupDate: pickupDateTime,
          pickupLocation: pickup.pickup_location,
          pickupTimeStart: pickup.pickup_time_start,
          pickupTimeEnd: pickup.pickup_time_end
        });
      } catch (emailError) {
        // Don't fail the webhook if email fails - order was still created successfully
        console.error('Failed to send order confirmation email:', emailError);
      }

      // Mark event as processed after successful order creation
      await markWebhookEventProcessed(eventId, event.type);
      return new NextResponse('Order created successfully', { status: 200 });

    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      console.error('Order creation error:', errorMessage);

      // Only send failure email for critical errors, not temporary issues
      const isTemporaryError = errorMessage.includes('inventory') ||
                               errorMessage.includes('Database service not available') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('UNAVAILABLE');

      if (!isTemporaryError) {
        // Send failure email to customer only for non-temporary errors
        // Use safe defaults for all values
        const safeCustomerName = customerName || 'Customer';
        const safeCustomerEmail = customerEmail || paymentIntent.receipt_email || '';

        if (safeCustomerEmail) {
          try {
            await sendOrderFailureEmail(
              safeCustomerName,
              safeCustomerEmail,
              paymentIntent.id
            );
          } catch (emailError) {
            // Don't fail the webhook if failure email fails
            console.error('Failed to send failure email:', emailError);
          }
        } else {
          console.error('No email address available to send failure notification');
        }
      } else {
        // For temporary errors, we should retry or handle gracefully
        // Return 500 so Stripe retries the webhook
        console.error('Temporary error during order creation, Stripe will retry:', errorMessage);
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