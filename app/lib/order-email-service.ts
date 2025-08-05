import { sendEmail } from './ses-email-service';
import { OrderData } from './products';

export interface OrderConfirmationData extends OrderData {
  orderId: string;
}

export const generateOrderConfirmationHTML = (order: OrderConfirmationData): string => {
  const formatPickupDate = (pickupDate: any): string => {
    if (!pickupDate) return 'TBD';
    const date = pickupDate.toDate ? pickupDate.toDate() : new Date(pickupDate);
    return date.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; font-weight: 500;">${item.productName}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">${item.price}</td>
      <td style="padding: 12px; text-align: right; font-weight: 600;">$${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Sour The Bakery</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">SOUR THE BAKERY</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 40px 30px;">
          <div style="background-color: #f8f8f5; border-left: 4px solid #D4AF37; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px; color: #8B4513; font-size: 22px;">Thank you for your order!</h2>
            <p style="margin: 0; color: #666; line-height: 1.5;">We've received your order and will have it ready for pickup. Here are your order details:</p>
          </div>

          <!-- Order Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px;">Order Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513; width: 120px;">Order #:</td>
                <td style="padding: 8px 0;">#${order.orderId.slice(-8)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513;">Customer:</td>
                <td style="padding: 8px 0;">${order.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513;">Total:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #D4AF37;">$${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #8B4513; color: white;">
                  <th style="padding: 15px 12px; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 15px 12px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 15px 12px; text-align: right; font-weight: 600;">Price</th>
                  <th style="padding: 15px 12px; text-align: right; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          <!-- Pickup Information -->
          <div style="background-color: #f0f8ff; border: 2px solid #D4AF37; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #8B4513; margin: 0 0 15px; font-size: 20px;">📍 Pickup Information</h3>
            <div style="line-height: 1.6; color: #333;">
              <p style="margin: 0 0 10px;"><strong>Pickup Date:</strong> ${formatPickupDate(order.pickupDate)}</p>
              <p style="margin: 0 0 10px;"><strong>Location:</strong> Sour The Bakery</p>
              <p style="margin: 0 0 10px;"><strong>Address:</strong> [Your bakery address here]</p>
              <p style="margin: 0 0 15px;"><strong>Hours:</strong> Sunday 9:00 AM - 12:00 PM</p>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin-top: 15px;">
                <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Please Note:</strong> Orders must be picked up during the scheduled time. If you cannot make your pickup time, please contact us as soon as possible.</p>
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; padding: 20px; background-color: #f8f8f5; border-radius: 8px;">
            <h4 style="color: #8B4513; margin: 0 0 10px;">Questions about your order?</h4>
            <p style="margin: 0; color: #666;">
              Email us at <a href="mailto:orders@sourthebakery.com" style="color: #D4AF37; text-decoration: none;">orders@sourthebakery.com</a><br>
              or call us at <strong>(555) 123-SOUR</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #8B4513; color: white; padding: 20px 30px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Thank you for choosing Sour The Bakery!</p>
          <p style="margin: 10px 0 0; font-size: 12px; opacity: 0.7;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateOrderFailureHTML = (customerName: string, customerEmail: string, paymentIntentId: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Processing Issue - Sour The Bakery</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">SOUR THE BAKERY</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Order Processing Issue</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px; color: #856404; font-size: 22px;">Payment Processed Successfully</h2>
            <p style="margin: 0; color: #856404; line-height: 1.5;">We've received your payment, but encountered an issue creating your order in our system.</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px;">What This Means</h3>
            <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
              <li><strong>Your payment was successful</strong> and has been processed</li>
              <li><strong>We're working to resolve</strong> the technical issue with your order</li>
              <li><strong>You will not be charged twice</strong> - your payment is secure</li>
              <li><strong>We'll contact you shortly</strong> with an update on your order</li>
            </ul>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px;">Payment Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513; width: 120px;">Customer:</td>
                <td style="padding: 8px 0;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513;">Email:</td>
                <td style="padding: 8px 0;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #8B4513;">Reference #:</td>
                <td style="padding: 8px 0;">${paymentIntentId.slice(-8)}</td>
              </tr>
            </table>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; padding: 20px; background-color: #f8f8f5; border-radius: 8px;">
            <h4 style="color: #8B4513; margin: 0 0 10px;">Need Immediate Assistance?</h4>
            <p style="margin: 0; color: #666;">
              Please contact us with your reference number:<br>
              Email: <a href="mailto:orders@sourthebakery.com" style="color: #D4AF37; text-decoration: none;">orders@sourthebakery.com</a><br>
              Phone: <strong>(555) 123-SOUR</strong>
            </p>
            <p style="margin: 15px 0 0; color: #666; font-size: 14px;">
              We sincerely apologize for this inconvenience and will resolve this quickly.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #8B4513; color: white; padding: 20px 30px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Thank you for your patience - Sour The Bakery</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendOrderFailureEmail = async (customerName: string, customerEmail: string, paymentIntentId: string): Promise<void> => {
  try {
    if (!customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailHTML = generateOrderFailureHTML(customerName, customerEmail, paymentIntentId);
    
    await sendEmail({
      from: process.env.SES_FROM_EMAIL || 'orders@sourthebakery.com',
      to: [customerEmail],
      subject: `Order Processing Issue - Reference #${paymentIntentId.slice(-8)} - Sour The Bakery`,
      html: emailHTML,
      replyTo: process.env.SES_REPLY_TO_EMAIL || 'orders@sourthebakery.com'
    });

    console.log(`Order failure email sent to ${customerEmail} for payment ${paymentIntentId}`);
  } catch (error) {
    console.error('Failed to send order failure email:', error);
    throw error;
  }
};

export const sendOrderConfirmationEmail = async (order: OrderConfirmationData): Promise<void> => {
  try {
    if (!order.customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailHTML = generateOrderConfirmationHTML(order);
    
    await sendEmail({
      from: process.env.SES_FROM_EMAIL || 'orders@sourthebakery.com',
      to: [order.customerEmail],
      subject: `Order Confirmation #${order.orderId.slice(-8)} - Sour The Bakery`,
      html: emailHTML,
      replyTo: process.env.SES_REPLY_TO_EMAIL || 'orders@sourthebakery.com'
    });

    console.log(`Order confirmation email sent to ${order.customerEmail} for order ${order.orderId}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
};