import { sendEmail, EmailAttachment } from './ses-email-service';
import { escapeHtml } from './input-validator';

export interface RecipePurchaseEmailData {
  customerName: string;
  customerEmail: string;
  recipeName: string;
  pdfUrl: string;
  price: string;
}

export const generateRecipePurchaseHTML = (data: RecipePurchaseEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Recipe Purchase - Sour The Bakery</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #228B22 0%, #32CD32 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">SOUR THE BAKERY</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Recipe Purchase Confirmation</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 40px 30px;">
          <div style="background-color: #f0f8f0; border-left: 4px solid #228B22; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px; color: #228B22; font-size: 22px;">Thank you for your purchase!</h2>
            <p style="margin: 0; color: #666; line-height: 1.5;">Your recipe is ready to download. Happy baking!</p>
          </div>

          <!-- Purchase Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #228B22; border-bottom: 2px solid #32CD32; padding-bottom: 10px; margin-bottom: 20px;">Purchase Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #228B22; width: 120px;">Recipe:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.recipeName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #228B22;">Customer:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.customerName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #228B22;">Price:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #32CD32;">${escapeHtml(data.price)}</td>
              </tr>
            </table>
          </div>

          <!-- Download Button -->
          <div style="background-color: #f0f8f0; border: 2px solid #32CD32; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <h3 style="color: #228B22; margin: 0 0 15px; font-size: 20px;">📥 Download Your Recipe</h3>
            <p style="margin: 0 0 20px; color: #666;">Click the button below to download your recipe PDF:</p>
            <a href="${data.pdfUrl}"
               style="display: inline-block; background-color: #32CD32; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Download Recipe PDF
            </a>
            <p style="margin: 20px 0 0; color: #666; font-size: 14px;">
              Link not working? Copy and paste this URL into your browser:<br>
              <span style="color: #32CD32; word-break: break-all;">${data.pdfUrl}</span>
            </p>
          </div>

          <!-- Recipe Tips -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 10px; color: #856404;">💡 Baking Tips</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404; line-height: 1.6;">
              <li>Read through the entire recipe before starting</li>
              <li>Make sure all ingredients are at room temperature unless specified</li>
              <li>Don't rush the fermentation process - patience is key!</li>
              <li>Save this email for future reference</li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; padding: 20px; background-color: #f0f8f0; border-radius: 8px;">
            <h4 style="color: #228B22; margin: 0 0 10px;">Questions or Need Help?</h4>
            <p style="margin: 0; color: #666;">
              Email us at <a href="mailto:sourthebakeryllc@gmail.com" style="color: #32CD32; text-decoration: none;">sourthebakeryllc@gmail.com</a><br>
              or call us at <strong>(860) 539-4014</strong>
            </p>
            <p style="margin: 15px 0 0; color: #666; font-size: 14px;">
              We'd love to see your baking creations! Tag us on social media.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #228B22; color: white; padding: 20px 30px; text-align: center;">
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

export const sendRecipePurchaseEmail = async (data: RecipePurchaseEmailData): Promise<void> => {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailHTML = generateRecipePurchaseHTML(data);

    // Download the PDF from the URL to attach it
    let attachments: EmailAttachment[] = [];

    try {
      console.log(`Downloading PDF from: ${data.pdfUrl}`);
      const response = await fetch(data.pdfUrl);

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // Create a clean filename from the recipe name
      const cleanFilename = data.recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${cleanFilename}_recipe.pdf`;

      attachments.push({
        filename: filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });

      console.log(`PDF downloaded successfully, size: ${pdfBuffer.length} bytes`);
    } catch (downloadError) {
      console.error('Failed to download PDF for attachment:', downloadError);
      console.log('Continuing to send email without attachment, download link will still work');
    }

    await sendEmail({
      from: process.env.SES_FROM_EMAIL || 'info@sourthebakery.com',
      to: [data.customerEmail],
      subject: `Your Recipe: ${data.recipeName} - Sour The Bakery`,
      html: emailHTML,
      replyTo: process.env.SES_REPLY_TO_EMAIL || 'info@sourthebakery.com',
      attachments: attachments.length > 0 ? attachments : undefined
    });

    console.log(`Recipe purchase email sent to ${data.customerEmail} for recipe ${data.recipeName}${attachments.length > 0 ? ' with PDF attachment' : ''}`);
  } catch (error) {
    console.error('Failed to send recipe purchase email:', error);
    throw error;
  }
};
