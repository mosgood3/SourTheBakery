import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ from, to, subject, html, replyTo, attachments }: EmailOptions) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  const recipients = Array.isArray(to) ? to : [to];

  // If there are attachments, use SendRawEmailCommand
  if (attachments && attachments.length > 0) {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Build email headers (before the blank line)
    const headers = [
      `From: ${from}`,
      `To: ${recipients.join(', ')}`,
      replyTo ? `Reply-To: ${replyTo}` : null,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`
    ].filter(Boolean).join('\r\n');

    // Build HTML part
    const htmlPart = [
      '',  // Blank line after headers (required by MIME spec)
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      html,
      ''
    ].join('\r\n');

    let rawEmail = headers + htmlPart;

    // Add attachments
    for (const attachment of attachments) {
      const attachmentPart = [
        '',
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content.toString('base64')
      ].join('\r\n');
      rawEmail += attachmentPart;
    }

    rawEmail += `\r\n\r\n--${boundary}--`;

    const command = new SendRawEmailCommand({
      Source: from,
      Destinations: recipients,
      RawMessage: {
        Data: Buffer.from(rawEmail)
      }
    });

    try {
      const result = await sesClient.send(command);
      return result;
    } catch (error) {
      console.error('SES Raw Email Error:', error);
      throw error;
    }
  }

  // No attachments - use simple SendEmailCommand
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
    return result;
  } catch (error) {
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