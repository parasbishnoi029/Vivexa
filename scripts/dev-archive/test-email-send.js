import { sendEmail } from './server/emailService.ts';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Sending a test email to parasbishnoi012@gmail.com...");
  const result = await sendEmail({
    recipient: "parasbishnoi012@gmail.com",
    template: "system-alert",
    subject: "Vivexa Test Email",
    data: {
      title: "Vivexa SMTP Test Diagnostics",
      message: "This is a diagnostic email sent during automated troubleshooting."
    }
  });
  console.log("Result:", result);
}

main().catch(err => console.error("Unhandled error:", err));
