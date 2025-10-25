import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterSubscribers, getOpenOrderCustomers } from '../../../lib/newsletter-server-supabase';
import { sendBulkEmails } from '../../../lib/ses-email-service';
import { createAuthenticatedHandler, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { createRateLimitedHandler } from '../../../lib/rate-limiter';
import { validateNewsletterData, sanitizeHtml } from '../../../lib/input-validator';
import { getPickupInfo } from '../../../lib/settings-supabase';

async function handleNewsletterSend(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    console.log('API Route: Received newsletter send request');
    
    const rawData = await request.json();
    console.log('Request data from user:', request.user?.email);

    // Validate input data
    const validation = validateNewsletterData(rawData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.errors },
        { status: 400 }
      );
    }

    const { subject, content, sentBy, recipientType } = validation.data;

    // Get recipients based on type
    let recipients: Array<{email: string, name?: string}> = [];
    let recipientTypeLabel = '';

    if (recipientType === 'newsletter') {
      console.log('Fetching newsletter subscribers...');
      const subscribers = await getNewsletterSubscribers();
      recipients = subscribers.map(s => ({ email: s.email }));
      recipientTypeLabel = 'newsletter subscribers';
    } else if (recipientType === 'orders') {
      console.log('Fetching customers with open orders...');
      const customers = await getOpenOrderCustomers();
      recipients = customers.map(c => ({ email: c.email, name: c.name }));
      recipientTypeLabel = 'customers with open orders';
    }

    console.log(`Found ${recipients.length} ${recipientTypeLabel}`);
    
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: `No active ${recipientTypeLabel} found` },
        { status: 400 }
      );
    }

    // Get pickup location from settings
    const pickupInfo = await getPickupInfo();

    // Prepare email template with sanitized content
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #228B22 0%, #32CD32 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">SOUR THE BAKERY</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Newsletter</p>
        </div>
        <div style="padding: 40px 30px; background-color: #fff; line-height: 1.6; color: #333;">
          ${content}
        </div>
        <div style="background-color: #228B22; color: white; padding: 20px 30px; text-align: center; font-size: 12px;">
          <p style="margin: 0 0 10px; opacity: 0.9;">You're receiving this because you subscribed to our newsletter.</p>
          <p style="margin: 0; opacity: 0.7;">SOUR The Bakery | Rocky Hill CT, 06067</p>
        </div>
      </div>
    `;

    // Send individual emails using Amazon SES
    const emailResult = await sendBulkEmails({
      from: process.env.SES_FROM_EMAIL || 'info@sourthebakery.com',
      to: recipients.map(r => r.email),
      subject: subject,
      html: htmlTemplate,
      replyTo: process.env.SES_REPLY_TO_EMAIL || 'info@sourthebakery.com'
    });

    // Handle different return types from sendBulkEmails
    let totalSent: number;
    let totalFailed: number;
    let errors: Array<{email: string, error: string}> = [];

    if ('totalSent' in emailResult) {
      // Bulk email result with multiple recipients
      totalSent = emailResult.totalSent;
      totalFailed = emailResult.totalFailed;
      errors = emailResult.errors;
    } else {
      // Single email result
      totalSent = 1;
      totalFailed = 0;
      errors = [];
    }

    console.log(`Email sending completed: ${totalSent} sent, ${totalFailed} failed`);
    
    if (errors.length > 0) {
      console.error('Failed to send to some recipients:', errors);
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${totalSent} ${recipientTypeLabel}`,
      recipientCount: totalSent,
      failedCount: totalFailed,
      recipientType: recipientType,
      ...(totalFailed > 0 && { failedEmails: errors })
    });

  } catch (error: any) {
    console.error('API Route Error:', {
      message: error.message,
      stack: error.stack,
      user: request.user?.email
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Apply authentication and rate limiting
export const POST = createRateLimitedHandler(
  createAuthenticatedHandler(handleNewsletterSend),
  {
    requests: 5, // Max 5 requests
    window: 60000, // Per minute
    blockDuration: 300000 // Block for 5 minutes
  }
);