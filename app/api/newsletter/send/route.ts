import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterSubscribers } from '../../../lib/newsletter-server';
import { sendEmail } from '../../../lib/ses-email-service';

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Received newsletter send request');
    
    const { subject, content, sentBy } = await request.json();
    console.log('Request data:', { subject: !!subject, content: !!content, sentBy });

    if (!subject || !content || !sentBy) {
      console.error('Missing required fields:', { subject: !!subject, content: !!content, sentBy: !!sentBy });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Prepare email template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f7e1b5; padding: 20px; text-align: center;">
          <h1 style="color: #8b5b29; margin: 0;">Sour the Bakery</h1>
        </div>
        <div style="padding: 30px; background-color: #fff; line-height: 1.6;">
          ${content.replace(/\n/g, '<br>')}
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this because you subscribed to our newsletter.</p>
          <p>Sour the Bakery | 12 Gaylord Drive, Rocky Hill, CT 06111</p>
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
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}