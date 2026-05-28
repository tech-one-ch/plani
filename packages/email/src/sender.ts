import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env["SMTP_HOST"] ?? "localhost",
    port: Number(process.env["SMTP_PORT"] ?? 1025),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: process.env["SMTP_USER"]
      ? {
          user: process.env["SMTP_USER"],
          pass: process.env["SMTP_PASS"],
        }
      : undefined,
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: process.env["SMTP_FROM"] ?? "Plani <no-reply@plani.local>",
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
