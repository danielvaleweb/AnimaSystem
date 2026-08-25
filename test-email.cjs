const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.umbler.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // 587 uses STARTTLS
    auth: {
      user: process.env.SMTP_USER || "comercial@animasystem.com.br",
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    const info = await transporter.sendMail({
      from: `"AnimaSystem Test" <${process.env.SMTP_USER || "comercial@animasystem.com.br"}>`,
      to: "danielvaleweb@gmail.com",
      subject: "Test from AnimaSystem",
      text: "Hello, this is a test email.",
    });
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending:", err);
  }
}
test();
