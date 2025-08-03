import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing SendGrid API...');
    
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      );
    }

    console.log('API Key present:', !!process.env.SENDGRID_API_KEY);

    // Test email
    const testEmail = {
      to: 'sourthebakeryllc@gmail.com', // Send to yourself for testing
      from: {
        email: 'sourthebakeryllc@gmail.com',
        name: 'Sour the Bakery'
      },
      subject: 'Test Email from Newsletter System',
      html: '<h1>Test Email</h1><p>This is a test email from your newsletter system.</p>'
    };

    console.log('Sending test email...');
    await sgMail.send(testEmail);
    console.log('Test email sent successfully!');

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error: any) {
    console.error('SendGrid Test Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    
    return NextResponse.json(
      { error: `SendGrid Error: ${error.message}` },
      { status: 500 }
    );
  }
}