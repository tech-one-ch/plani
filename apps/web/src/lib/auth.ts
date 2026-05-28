import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
  sendEmail,
} from "@plani/email";
import { getDb } from "@plani/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, organization } from "better-auth/plugins";

const db = getDb();

export const auth = betterAuth({
  baseURL: process.env["APP_URL"] ?? "http://localhost:3000",
  secret: process.env["AUTH_SECRET"],
  trustedOrigins: [process.env["APP_URL"] ?? "http://localhost:3000"],

  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Plani password",
        html: await renderPasswordResetEmail({ url, username: user.name }),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Plani account",
        html: await renderVerificationEmail({ url, username: user.name }),
      });
    },
  },

  socialProviders: {
    ...(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]
      ? {
          google: {
            clientId: process.env["GOOGLE_CLIENT_ID"],
            clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
          },
        }
      : {}),
  },

  plugins: [
    organization({
      sendInvitationEmail: async ({ invitation, inviter, organization: org }) => {
        const baseUrl = process.env["APP_URL"] ?? "http://localhost:3000";
        await sendEmail({
          to: invitation.email,
          subject: `You've been invited to ${org.name} on Plani`,
          html: await renderInvitationEmail({
            url: `${baseUrl}/invite/${invitation.id}`,
            inviterName: inviter.user.name,
            organizationName: org.name,
            role: invitation.role,
            recipientEmail: invitation.email,
          }),
        });
      },
    }),
    admin(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Your Plani sign-in link",
          html: await renderMagicLinkEmail({ url, email }),
        });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
