
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "ResearchHub Project",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email }],
      subject: "Verify Your ResearchHub Account",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to ResearchHub!</h2>
          <p>Thank you for registering.</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationLink}"
             style="display:inline-block;padding:12px 20px;
             background-color:#2563eb;color:white;
             text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
          <p>This verification link expires in 24 hours.</p>
          <p>If you did not create this account, you can ignore this email.</p>
          <p>ResearchHub Team</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorDetails}`);
  }

  return await response.json();
};

module.exports = { sendVerificationEmail };
