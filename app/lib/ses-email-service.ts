import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ from, to, subject, html, replyTo }: EmailOptions) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  const recipients = Array.isArray(to) ? to : [to];

  const command = new SendEmailCommand({
    Source: from,
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const result = await sesClient.send(command);
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Function to send individual emails to multiple recipients
export async function sendBulkEmails({ from, to, subject, html, replyTo }: EmailOptions) {
  if (!Array.isArray(to)) {
    return sendEmail({ from, to, subject, html, replyTo });
  }

  const results = [];
  const errors = [];

  for (const recipient of to) {
    try {
      const result = await sendEmail({ 
        from, 
        to: recipient, 
        subject, 
        html, 
        replyTo 
      });
      results.push({ email: recipient, success: true, messageId: result.MessageId });
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error);
      errors.push({ email: recipient, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return {
    results,
    errors,
    totalSent: results.length,
    totalFailed: errors.length
  };
}