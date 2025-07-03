import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (
  email: string,
  otp: string,
  type: 'login' | 'registration' | 'password_reset'
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const subject =
      type === 'registration'
        ? 'Welcome to PTEbyDee - Verify Your Email'
        : type === 'login'
        ? 'PTEbyDee - Login Verification Code'
        : 'PTEbyDee - Password Reset Code';

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
          .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #3B82F6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PTEbyDee</h1>
            <p>${
              type === 'registration'
                ? 'Welcome to your PTE journey!'
                : 'Verification Required'
            }</p>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>
              ${
                type === 'registration'
                  ? 'Thank you for joining PTEbyDee! Please use the verification code below to complete your registration:'
                  : type === 'login'
                  ? 'Please use the verification code below to sign in to your account:'
                  : 'Please use the verification code below to reset your password:'
              }
            </p>
            
            <div class="otp-box">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p><small>This code expires in 10 minutes</small></p>
            </div>

            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. PTEbyDee will never ask for your verification code via phone or email.
            </div>

            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 PTEbyDee. All rights reserved.</p>
            <p>Need help? Contact us at support@ptebydee.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"PTEbyDee" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to PTEbyDee!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
          .feature-item::before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to PTEbyDee, ${name}! 🎉</h1>
            <p>Your journey to PTE success starts here</p>
          </div>
          <div class="content">
            <h2>You're all set!</h2>
            <p>Congratulations on joining thousands of successful PTE students. We're excited to help you achieve your target score!</p>
            
            <div class="features">
              <h3>What's next?</h3>
              <div class="feature-item">Explore our comprehensive PTE courses</div>
              <div class="feature-item">Take a free diagnostic test</div>
              <div class="feature-item">Create your personalized study plan</div>
              <div class="feature-item">Join our community of learners</div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">Start Learning Now</a>
            </div>

            <p>If you have any questions, our support team is here to help at support@ptebydee.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"PTEbyDee" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to PTEbyDee - Let's Get Started!",
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
};
