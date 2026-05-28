import { render } from "@react-email/components";
export { sendEmail, type EmailPayload } from "./sender";
export { VerificationEmail } from "./templates/verification";
export { PasswordResetEmail } from "./templates/password-reset";
export { MagicLinkEmail } from "./templates/magic-link";
export { InvitationEmail } from "./templates/invitation";

export async function renderVerificationEmail(props: {
  url: string;
  username?: string;
}): Promise<string> {
  const { VerificationEmail: Template } = await import("./templates/verification");
  return render(Template(props));
}

export async function renderPasswordResetEmail(props: {
  url: string;
  username?: string;
}): Promise<string> {
  const { PasswordResetEmail: Template } = await import("./templates/password-reset");
  return render(Template(props));
}

export async function renderMagicLinkEmail(props: { url: string; email: string }): Promise<string> {
  const { MagicLinkEmail: Template } = await import("./templates/magic-link");
  return render(Template(props));
}

export async function renderInvitationEmail(props: {
  url: string;
  inviterName: string;
  organizationName: string;
  role: string;
  recipientEmail: string;
}): Promise<string> {
  const { InvitationEmail: Template } = await import("./templates/invitation");
  return render(Template(props));
}
