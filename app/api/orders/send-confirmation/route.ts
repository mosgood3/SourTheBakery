import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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

    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not found in environment');
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      );
    }

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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Sour the Bakery</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f7e1b5 0%, #e6d4a0 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #8b5b29; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(139, 91, 41, 0.1);">
              🥖 Sour the Bakery
            </h1>
            <p style="color: #8b5b29; margin: 10px 0 0 0; font-size: 16px; opacity: 0.8;">
              Artisanal Sourdough & Fresh Baked Goods
            </p>
          </div>

          <!-- Order Confirmation -->
          <div style="padding: 40px 30px; background-color: #fff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background-color: #e8f5e8; color: #2d5016; padding: 12px 24px; border-radius: 25px; font-weight: bold; font-size: 18px;">
                ✅ Order Confirmed!
              </div>
            </div>

            <h2 style="color: #8b5b29; margin: 0 0 10px 0; font-size: 24px;">Thank you, ${orderData.customerName}!</h2>
            <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
              Your order has been received and payment processed successfully. We're excited to prepare your fresh sourdough treats!
            </p>

            <!-- Order Details -->
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #8b5b29; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f7e1b5; padding-bottom: 8px;">
                📋 Order Details
              </h3>
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong style="color: #333;">Order ID:</strong> ${orderData.orderId}
              </p>
              <p style="margin: 0; color: #666;">
                <strong style="color: #333;">Email:</strong> ${orderData.customerEmail}
              </p>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #8b5b29; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #f7e1b5; padding-bottom: 8px;">
                🛒 Your Items
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 15px 0; text-align: left; color: #8b5b29; font-weight: bold; border-bottom: 2px solid #f7e1b5;">Item</th>
                    <th style="padding: 15px 0; text-align: center; color: #8b5b29; font-weight: bold; border-bottom: 2px solid #f7e1b5;">Qty</th>
                    <th style="padding: 15px 0; text-align: right; color: #8b5b29; font-weight: bold; border-bottom: 2px solid #f7e1b5;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f8f9fa;">
                    <td colspan="2" style="padding: 15px 0; color: #8b5b29; font-weight: bold; font-size: 18px; border-top: 2px solid #f7e1b5;">Total:</td>
                    <td style="padding: 15px 0; text-align: right; color: #8b5b29; font-weight: bold; font-size: 18px; border-top: 2px solid #f7e1b5;">${orderData.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Pickup Information -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #1565c0; margin: 0 0 15px 0; font-size: 18px;">
                📍 Pickup Information
              </h3>
              <div style="color: #1976d2;">
                <p style="margin: 0 0 8px 0; font-size: 16px;">
                  <strong>📅 Date:</strong> ${pickupDate}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 16px;">
                  <strong>🕒 Time:</strong> ${pickupTime}
                </p>
                <p style="margin: 0; font-size: 16px;">
                  <strong>📍 Location:</strong> ${pickupLocation}
                </p>
              </div>
            </div>

            <!-- Important Notes -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📝 Important Notes:</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px;">
                <li style="margin-bottom: 5px;">Please arrive at your scheduled pickup time</li>
                <li style="margin-bottom: 5px;">Bring a copy of this email or your order ID</li>
                <li style="margin-bottom: 5px;">Contact us if you need to make any changes</li>
                <li>We'll have your fresh items ready and waiting!</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
              <h4 style="color: #8b5b29; margin: 0 0 15px 0;">Questions about your order?</h4>
              <p style="color: #666; margin: 0 0 10px 0;">
                📧 <a href="mailto:sourthebakery@gmail.com" style="color: #8b5b29; text-decoration: none;">sourthebakery@gmail.com</a>
              </p>
              <p style="color: #666; margin: 0;">
                📍 12 Gaylord Drive, Rocky Hill, CT 06111
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #8b5b29; color: #f7e1b5; padding: 30px 20px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">Thank you for choosing Sour the Bakery! 🥖</p>
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">We appreciate your business and can't wait to share our freshly baked sourdough with you.</p>
            
            <!-- Social Media Links -->
            <div style="margin: 20px 0 0 0;">
              <a href="https://www.instagram.com/sourthebakery/" style="color: #f7e1b5; text-decoration: none; margin: 0 10px;">📱 Instagram</a>
              <a href="https://www.tiktok.com/@sourthebakery" style="color: #f7e1b5; text-decoration: none; margin: 0 10px;">🎵 TikTok</a>
              <a href="https://m.facebook.com/profile.php?id=61577470065750" style="color: #f7e1b5; text-decoration: none; margin: 0 10px;">📘 Facebook</a>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    // Prepare email data
    const emailData = {
      to: orderData.customerEmail,
      from: {
        email: 'sourthebakery@gmail.com',
        name: 'Sour the Bakery'
      },
      subject: `Order Confirmation #${orderData.orderId} - Sour the Bakery`,
      html: emailHtml
    };

    // Send email using SendGrid
    console.log('Sending order confirmation email via SendGrid...');
    try {
      await sgMail.send(emailData);
      console.log('SendGrid: Order confirmation email sent successfully!');
    } catch (sendGridError: any) {
      console.error('SendGrid Error Details:', {
        message: sendGridError.message,
        code: sendGridError.code,
        response: sendGridError.response?.body
      });
      throw sendGridError;
    }

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