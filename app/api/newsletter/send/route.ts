import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterSubscribers } from '../../../lib/newsletter-server';
import { sendEmail } from '../../../lib/ses-email-service';
import { createAuthenticatedHandler, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { createRateLimitedHandler } from '../../../lib/rate-limiter';
import { validateNewsletterData, sanitizeHtml } from '../../../lib/input-validator';

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

    const { subject, content, sentBy } = validation.data;

    // Get all active subscribers
    console.log('Fetching subscribers...');
    const subscribers = await getNewsletterSubscribers();
    console.log(`Found ${subscribers.length} subscribers`);
    
    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      );
    }

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
          <p style="margin: 0; opacity: 0.7;">Sour the Bakery | 12 Gaylord Drive, Rocky Hill, CT 06111</p>
        </div>
      </div>
    `;

    // Send emails using Amazon SES
    await sendEmail({
      from: process.env.SES_FROM_EMAIL || 'info@sourthebakery.com',
      to: subscribers.map(s => s.email),
      subject: subject,
      html: htmlTemplate,
      replyTo: process.env.SES_REPLY_TO_EMAIL || 'info@sourthebakery.com'
    });

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      recipientCount: subscribers.length
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