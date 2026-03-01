import * as crypto from 'crypto';

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

interface BrevoApiResponse {
  messageId?: string;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const emailData = {
    sender: {
      name: 'Drowsiness Detection System',
      email: process.env.FROM_EMAIL || 'jvazares2004@gmail.com',
    },
    to: [
      {
        email: to,
      },
    ],
    subject: 'Email Verification Code',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Drowsiness Detection System</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Secure Email Verification</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
          <p style="font-size: 16px; line-height: 1.5;">Dear User,</p>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for registering with our Drowsiness Detection System. To complete your verification, please use the following code:</p>
          <div style="background: #f8f9fa; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h1 style="margin: 0; color: #007bff; letter-spacing: 8px; font-size: 32px;">${code}</h1>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.5;">
            This verification code will expire in <strong>10 minutes</strong> for security reasons. If you did not request this verification, please disregard this email.
          </p>
          <p style="font-size: 14px; color: #666; line-height: 1.5;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            © 2026 Drowsiness Detection System. All rights reserved.<br>
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    textContent: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Brevo API Error:', error);
    throw new Error(
      `Failed to send email via Brevo API: ${response.status} ${error}`,
    );
  }

  const result = (await response.json()) as BrevoApiResponse;
  console.log(
    `Email sent successfully to ${to}. Message ID: ${result.messageId || 'N/A'}`,
  );
}
