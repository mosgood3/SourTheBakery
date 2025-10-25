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
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Add idempotency check to prevent duplicate processing
  const eventId = event.id;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Processing webhook event:', eventId, 'Type:', event.type);
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

    // Check if this is a recipe purchase
    if (metadata.type === 'recipe') {
      try {
        const { recipeId, recipeName } = metadata;
        const customerEmail = paymentIntent.receipt_email || '';
        const customerName = paymentIntent.shipping?.name || 'Customer';

        if (!recipeId || !customerEmail) {
          console.error('Missing recipe metadata:', metadata);
          return new NextResponse('Missing required metadata', { status: 400 });
        }

        // Get the recipe details
        const recipe = await getRecipe(recipeId);
        if (!recipe) {
          console.error('Recipe not found:', recipeId);
          return new NextResponse('Recipe not found', { status: 404 });
        }

        // Create recipe purchase record
        const purchaseId = await createRecipePurchase({
          recipe_name: recipe.name,
          recipe_id: recipeId,
          customer_name: customerName,
          customer_email: customerEmail,
          price: recipe.price,
          download_url: recipe.pdf_url
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log('Recipe purchase created:', purchaseId);
        }

        // Send recipe purchase email with PDF
        try {
          await sendRecipePurchaseEmail({
            customerName,
            customerEmail,
            recipeName: recipe.name,
            pdfUrl: recipe.pdf_url,
            price: recipe.price
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log('Recipe purchase email sent for purchase:', purchaseId);
          }
        } catch (emailError) {
          console.error('Failed to send recipe purchase email:', emailError);
          // Don't fail the webhook if email fails - purchase was still created
        }

        return new NextResponse('Recipe purchase processed', { status: 200 });
      } catch (err: any) {
        console.error('Error processing recipe purchase:', err);
        return new NextResponse('Recipe purchase processing failed', { status: 500 });
      }
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

      if (process.env.NODE_ENV !== 'production') {
        console.log('Order created successfully:', orderId);
      }
      
      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          ...orderData,
          orderId,
          orderDate: new Date(), // Add orderDate for email template
          pickupDate: pickupDateTime // Use the actual pickup date for email
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
        pickupDateTime: pickupInfo ? new Date(`${pickupInfo.date}T${pickupInfo.time}-05:00`) : 'MISSING'
      });
      
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
          console.log('Order failure email sent for payment:', paymentIntent.id);
        } catch (emailError) {
          console.error('Failed to send order failure email:', emailError);
          // Don't fail the webhook if failure email fails
        }
      } else {
        console.log('Temporary error detected, not sending failure email:', err.message);
        // For temporary errors, we should retry or handle gracefully
        // Return 500 so Stripe retries the webhook
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