import nodemailer from 'nodemailer';
// Email service configuration
const createTransporter = () => {
  // For development, you can use Gmail with app password
  // For production, use services like SendGrid, AWS SES, etc.

  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid)
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
  } else {
    // Development - Gmail with app password
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail app password
      },
    });
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  type: 'login' | 'registration'
) => {
  try {
    const transporter = createTransporter();

    const subject =
      type === 'registration'
        ? 'Welcome to PTEbyDee - Verify Your Email'
        : 'PTEbyDee - Login Verification Code';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 PTEbyDee</h1>
            <p>${
              type === 'registration'
                ? 'Welcome to your PTE journey!'
                : 'Secure Login Verification'
            }</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>${
              type === 'registration'
                ? 'Thank you for joining PTEbyDee! To complete your registration, please verify your email address with the code below:'
                : 'You requested to sign in to your PTEbyDee account. Please use the verification code below:'
            }</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">This code expires in 10 minutes</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code is valid for 10 minutes only</li>
              <li>Don't share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            
            ${
              type === 'registration'
                ? `
              <p>Once verified, you'll have access to:</p>
              <ul>
                <li>✅ Expert PTE preparation courses</li>
                <li>✅ Mock tests and practice materials</li>
                <li>✅ Personalized study plans</li>
                <li>✅ Progress tracking and analytics</li>
              </ul>
            `
                : ''
            }
            
            <div class="footer">
              <p>Best regards,<br>The PTEbyDee Team</p>
              <p style="font-size: 12px; color: #999;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"PTEbyDee" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
