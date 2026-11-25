const nodemailer = require('nodemailer');

/**
 * Creates nodemailer transport based on environment variables.
 * Supports Gmail, custom SMTP, or fallback logging.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  if (user && pass) {
    if (host && host !== 'smtp.gmail.com') {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    }

    // Default to Gmail service if user/pass provided or host is smtp.gmail.com
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return null;
}

/**
 * Ultra-minimalist, app-themed HTML email for admin OTP (short text + theme color OTP)
 */
function buildOtpEmailHtml({ adminName, otp, expiryMinutes = 10 }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Code</title>
</head>
<body style="margin: 0; padding: 36px 16px; background-color: #F5F3FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #120F29; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 400px; background-color: #FFFFFF; border-radius: 18px; border: 1px solid #E3DEFC; box-shadow: 0 4px 20px rgba(107, 88, 214, 0.06); padding: 32px 24px; text-align: center;">
          <tr>
            <td>
              <!-- Minimal Brand Title in App Theme Color -->
              <div style="font-size: 22px; font-weight: 800; color: #6B58D6; letter-spacing: -0.5px; margin-bottom: 6px;">
                PriceMyGem
              </div>

              <!-- Very Short Minimalist Text -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280; line-height: 1.5;">
                Your admin password reset code is:
              </p>

              <!-- OTP Code in App Theme Color (#6B58D6) -->
              <div style="background-color: #F5F3FF; border: 2px dashed #6B58D6; border-radius: 14px; padding: 18px 8px; margin: 16px 0 20px;">
                <div style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #6B58D6; padding-left: 12px; line-height: 1.2;">
                  ${otp}
                </div>
              </div>

              <!-- Short Notice -->
              <p style="margin: 0; font-size: 12.5px; color: #94A3B8; line-height: 1.4;">
                Valid for ${expiryMinutes} minutes. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends OTP to admin email
 */
async function sendAdminResetOtpEmail(email, otp, adminName = 'Admin') {
  const transporter = createTransporter();
  const htmlContent = buildOtpEmailHtml({ adminName, otp, expiryMinutes: 10 });
  const textContent = `PriceMyGem Admin Password Reset\n\nYour 6-digit verification code is: ${otp}\nValid for 10 minutes.`;

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   💎 [PriceMyGem] ADMIN PASSWORD RESET OTP GENERATED         ║');
  console.log(`║   Recipient: ${email.padEnd(47)} ║`);
  console.log(`║   OTP Code:  \x1b[1m\x1b[35m${otp}\x1b[0m                                             ║`);
  console.log('║   Validity:  10 Minutes                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (!transporter) {
    console.log('ℹ️ SMTP is not configured in .env. OTP displayed above for instant development use.');
    return {
      sent: true,
      deliveredVia: 'console_fallback',
      message: 'OTP generated and logged to console (configure SMTP_USER & SMTP_PASS in .env for real inbox delivery)'
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `PriceMyGem Admin <${process.env.SMTP_USER || 'no-reply@pricemygem.com'}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `${otp} is your PriceMyGem verification code`,
      text: textContent,
      html: htmlContent
    });

    console.log('✅ Real-time OTP email sent successfully to', email, 'MessageId:', info.messageId);
    return {
      sent: true,
      deliveredVia: 'smtp',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('⚠️ SMTP email sending error, falling back to console:', error.message);
    return {
      sent: true,
      deliveredVia: 'console_fallback',
      error: error.message
    };
  }
}

/**
 * Sends OTP to mobile app user for password reset or signup verification
 */
async function sendUserOtpEmail({ email, otp, purpose = 'reset', fullName = 'User' }) {
  const transporter = createTransporter();
  const isSignup = purpose === 'signup';
  const label = isSignup ? 'Account Registration' : 'Password Reset';
  const subject = `${otp} is your PriceMyGem ${isSignup ? 'registration' : 'verification'} code`;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${label}</title>
</head>
<body style="margin: 0; padding: 36px 16px; background-color: #F5F3FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #120F29; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 420px; background-color: #FFFFFF; border-radius: 18px; border: 1px solid #E3DEFC; box-shadow: 0 4px 20px rgba(107, 88, 214, 0.06); padding: 32px 24px; text-align: center;">
          <tr>
            <td>
              <div style="font-size: 22px; font-weight: 800; color: #6B58D6; letter-spacing: -0.5px; margin-bottom: 6px;">
                PriceMyGem
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #8877E3; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                ${isSignup ? 'Account Verification' : 'Password Recovery'}
              </div>

              <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280; line-height: 1.5;">
                Hello ${fullName || 'there'}, your 6-digit verification code is:
              </p>

              <div style="background-color: #F5F3FF; border: 2px dashed #6B58D6; border-radius: 14px; padding: 18px 8px; margin: 16px 0 20px;">
                <div style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #6B58D6; padding-left: 12px; line-height: 1.2;">
                  ${otp}
                </div>
              </div>

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.4;">
                This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `PriceMyGem ${label}\n\nHello ${fullName || 'User'},\nYour 6-digit verification code is: ${otp}\nValid for 10 minutes.`;

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║   💎 [PriceMyGem] USER ${label.toUpperCase()} OTP GENERATED        ║`);
  console.log(`║   Recipient: ${email.padEnd(47)} ║`);
  console.log(`║   OTP Code:  \x1b[1m\x1b[32m${otp}\x1b[0m                                             ║`);
  console.log('║   Validity:  10 Minutes                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (!transporter) {
    return {
      sent: true,
      deliveredVia: 'console_fallback',
      message: 'OTP generated and logged to console'
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `PriceMyGem <${process.env.SMTP_USER || 'no-reply@pricemygem.com'}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log('✅ Real-time User OTP email sent successfully to', email, 'MessageId:', info.messageId);
    return {
      sent: true,
      deliveredVia: 'smtp',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('⚠️ SMTP email sending error, falling back to console:', error.message);
    return {
      sent: true,
      deliveredVia: 'console_fallback',
      error: error.message
    };
  }
}

module.exports = {
  sendAdminResetOtpEmail,
  sendUserOtpEmail,
  buildOtpEmailHtml
};

