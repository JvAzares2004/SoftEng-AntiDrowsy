import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Drowsiness Detection System" <${process.env.FROM_EMAIL || process.env.MAIL_USER}>`,
    to,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html: `
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
  };

  await transporter.sendMail(mailOptions);
}
