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
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ from, to, subject, html, replyTo }: EmailOptions) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  const command = new SendEmailCommand({
    Source: from,
    ...(replyTo && { ReplyToAddresses: [replyTo] }),
    Destination: {
      ToAddresses: to,
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