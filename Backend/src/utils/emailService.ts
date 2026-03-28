import nodemailer from 'nodemailer';

type SupportTicketEmailPayload = {
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  message?: string;
  createdAt?: Date;
  status?: 'RESOLVED' | 'CLOSED';
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const getFromEmail = () => process.env.EMAIL_USER || process.env.SMTP_USER || '';

const getSupportInbox = () =>
  process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || '';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
            <p>Need help? Contact us at ptebydee@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PTEbyDee" <${getFromEmail()}>`,
      to: email,
      subject,
      html,
    });

    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

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
            <h1>Welcome to PTEbyDee, ${name}!</h1>
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

            <p>If you have any questions, our support team is here to help at ptebydee@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PTEbyDee" <${getFromEmail()}>`,
      to: email,
      subject: "Welcome to PTEbyDee - Let's Get Started!",
      html,
    });

    console.log(`Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendSupportTicketNotificationEmail = async (
  payload: SupportTicketEmailPayload
): Promise<boolean> => {
  try {
    const inboxEmail = getSupportInbox();
    if (!inboxEmail) {
      console.warn('Support inbox email is not configured. Skipping notification email.');
      return false;
    }

    const transporter = createTransporter();
    const formattedDate = payload.createdAt
      ? payload.createdAt.toLocaleString()
      : new Date().toLocaleString();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Support Ticket</title>
      </head>
      <body style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 24px; color: #1f2937;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 24px;">
            <h1 style="margin: 0; font-size: 24px;">New Support Ticket</h1>
            <p style="margin: 8px 0 0;">${payload.ticketNumber}</p>
          </div>
          <div style="padding: 24px;">
            <p><strong>Name:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            <p><strong>Subject:</strong> ${payload.subject}</p>
            <p><strong>Created At:</strong> ${formattedDate}</p>
            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <strong>Message</strong>
              <p style="white-space: pre-wrap; margin-bottom: 0;">${payload.message || ''}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PTEbyDee" <${getFromEmail()}>`,
      to: inboxEmail,
      replyTo: payload.email,
      subject: `[Support] ${payload.ticketNumber} - ${payload.subject}`,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending support notification email:', error);
    return false;
  }
};

export const sendSupportTicketConfirmationEmail = async (
  payload: SupportTicketEmailPayload
): Promise<boolean> => {
  try {
    if (!payload.email) {
      return false;
    }

    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 24px; color: #1f2937;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 24px;">
            <h1 style="margin: 0; font-size: 24px;">We received your support request</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hi ${payload.name},</p>
            <p>Thanks for contacting PTEbyDee support. Your request has been received successfully.</p>
            <p><strong>Reference number:</strong> ${payload.ticketNumber}</p>
            <p><strong>Subject:</strong> ${payload.subject}</p>
            <p>Our team will review your message and get back to you as soon as possible.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PTEbyDee" <${getFromEmail()}>`,
      to: payload.email,
      subject: `We received your request (${payload.ticketNumber})`,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending support confirmation email:', error);
    return false;
  }
};

export const sendSupportTicketStatusEmail = async (
  payload: SupportTicketEmailPayload
): Promise<boolean> => {
  try {
    if (!payload.email || !payload.status) {
      return false;
    }

    const transporter = createTransporter();
    const isResolved = payload.status === 'RESOLVED';
    const heading = isResolved
      ? 'Your support ticket has been resolved'
      : 'Your support ticket has been closed';
    const bodyText = isResolved
      ? 'We have reviewed your request and marked it as resolved. If you still need help, you can reply to this email or submit a new support request.'
      : 'Your support request has now been closed. If the issue comes up again, you can always contact us with your reference number.';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${heading}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 24px; color: #1f2937;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 24px;">
            <h1 style="margin: 0; font-size: 24px;">${heading}</h1>
          </div>
          <div style="padding: 24px;">
            <p>Hi ${payload.name},</p>
            <p>${bodyText}</p>
            <p><strong>Reference number:</strong> ${payload.ticketNumber}</p>
            <p><strong>Subject:</strong> ${payload.subject}</p>
            <p><strong>Current status:</strong> ${payload.status.replace('_', ' ')}</p>
            <p>If you need more help, contact us at ${getSupportInbox()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PTEbyDee" <${getFromEmail()}>`,
      to: payload.email,
      subject: `${heading} (${payload.ticketNumber})`,
      html,
    });

    return true;
  } catch (error) {
    console.error('Error sending support status email:', error);
    return false;
  }
};
