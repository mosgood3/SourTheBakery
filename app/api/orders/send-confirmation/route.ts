import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/ses-email-service';

interface OrderItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
}

interface OrderData {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: string;
  orderId: string;
  pickupInfo: {
    date: string;
    time: string;
    location: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Received order confirmation email request');
    
    const orderData: OrderData = await request.json();
    console.log('Order data:', { 
      customerEmail: orderData.customerEmail, 
      orderId: orderData.orderId,
      itemCount: orderData.items?.length 
    });

    // Validate required fields
    if (!orderData.customerEmail || !orderData.customerName || !orderData.items || !orderData.orderId) {
      console.error('Missing required fields for order confirmation email');
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }
    
    // Generate order items HTML
    const orderItemsHtml = orderData.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; color: #333;">${item.name}</td>
        <td style="padding: 12px 0; text-align: center; color: #666;">${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; color: #333; font-weight: 600;">$${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Format pickup date
    const pickupDate = orderData.pickupInfo ? 
      new Date(orderData.pickupInfo.date + 'T' + orderData.pickupInfo.time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'TBD';

    const pickupTime = orderData.pickupInfo?.time || 'TBD';
    const pickupLocation = orderData.pickupInfo?.location || 'Sour the Bakery';

    // Create email HTML template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
        <div style="background-color: #f7e1b5; padding: 30px; text-align: center;">
          <h1 style="color: #8b5b29; margin: 0; font-size: 28px;">Sour the Bakery</h1>
          <p style="color: #8b5b29; margin: 10px 0 0 0; font-size: 18px;">Order Confirmation</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #8b5b29; margin-bottom: 20px;">Thank you for your order, ${orderData.customerName}!</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderData.orderId}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin-bottom: 15px;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f7e1b5;">
                  <th style="padding: 12px; text-align: left; color: #8b5b29;">Item</th>
                  <th style="padding: 12px; text-align: center; color: #8b5b29;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #8b5b29;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #8b5b29;">
              <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">
                Order Total: ${orderData.total}
              </p>
            </div>
          </div>

          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5b29; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0;">Pickup Information</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${pickupDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${pickupTime}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${pickupLocation}</p>
            <p style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">
              Please arrive within 15 minutes of your scheduled pickup time. If you need to reschedule, please call us at least 24 hours in advance.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #333; margin-bottom: 10px;">Questions about your order?</p>
            <p style="color: #8b5b29; font-weight: bold;">Call us: (860) 123-4567</p>
            <p style="color: #8b5b29; font-weight: bold;">Email: info@sourthebakery.com</p>
          </div>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">Thank you for choosing Sour the Bakery!</p>
          <p style="margin: 5px 0 0 0;">12 Gaylord Drive, Rocky Hill, CT 06111</p>
        </div>
      </div>
    `;

    // Send email using Amazon SES
    await sendEmail({
      from: 'Sour the Bakery <info@sourthebakery.com>',
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderId} - Sour the Bakery`,
      html: emailHtml
    });

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully'
    });

  } catch (error: any) {
    console.error('Order confirmation email error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send order confirmation email' },
      { status: 500 }
    );
  }
}