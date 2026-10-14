
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [email],
    subject: 'Verify your Travel Planner account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto;">
        <h2>Welcome to Travel Planner, ${escapeHtml(name)}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${verificationUrl}"
             style="display:inline-block;padding:12px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;">
            Verify Email Address
          </a>
        </p>
        <p>This link expires in 30 minutes. If you didn't create an account, ignore this email.</p>
      </div>
    `
  });

  if (error) {
    throw new Error(error.message || 'Failed to send verification email.');
  }

  return data;
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

module.exports = { sendVerificationEmail };
