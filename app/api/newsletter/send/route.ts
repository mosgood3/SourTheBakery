import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { getNewsletterSubscribers } from '../../../lib/newsletter-server';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Received newsletter send request');
    
    const { subject, content, sentBy } = await request.json();
    console.log('Request data:', { subject: !!subject, content: !!content, sentBy });

    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not found in environment');
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      );
    }

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

    // Prepare email data
    console.log('Preparing email data...');
    const emails = subscribers.map(subscriber => ({
      to: subscriber.email,
      from: {
        email: sentBy,
        name: 'Sour the Bakery'
      },
      subject: subject,
      html: `
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
      `
    }));

    // Send emails using SendGrid
    console.log(`Attempting to send newsletter to ${subscribers.length} subscribers...`);
    console.log('Using API key:', process.env.SENDGRID_API_KEY ? 'Present' : 'Missing');
    
    try {
      await sgMail.send(emails);
      console.log('SendGrid: Newsletter sent successfully!');
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
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      recipientCount: subscribers.length
    });

  } catch (error: any) {
    console.error('API Route Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}