
const nodemailer = require("nodemailer");

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ResearchHub Project" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify Your ResearchHub Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to ResearchHub!</h2>

        <p>Thank you for registering.</p>

        <p>Please click the button below to verify your email address:</p>

        <a
          href="${verificationLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verify Email
        </a>

        <p>This verification link expires in 24 hours.</p>

        <p>If you did not create this account, you can ignore this email.</p>

        <p>ResearchHub Team</p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
};
