import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '../../../lib/products-supabase';
import { createRateLimitedHandler } from '../../../lib/rate-limiter';
import { validateEmail } from '../../../lib/input-validator';

async function handleOrderVerification(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { paymentIntentId, customerEmail } = body;

    if (!paymentIntentId || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get recent orders for this customer
    const orders = await getOrders();
    
    // Look for an order created in the last 5 minutes for this customer
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentOrder = orders.find(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return order.customerEmail === customerEmail && orderDate > fiveMinutesAgo;
    });

    if (recentOrder) {
      return NextResponse.json({ 
        success: true, 
        orderId: recentOrder.id,
        message: 'Order verified successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found in recent orders' 
      }, { status: 404 });
    }
  } catch (err: any) {
    console.error('Order verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Apply rate limiting
export const POST = createRateLimitedHandler(handleOrderVerification, {
  requests: 5, // Max 5 requests
  window: 60000, // Per minute
  blockDuration: 60000 // Block for 1 minute
}); 