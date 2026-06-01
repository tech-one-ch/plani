import {
  renderInvitationEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
  sendEmail,
} from "@plani/email";
import {
  accounts,
  getDb,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "@plani/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, organization } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";

const db = getDb();

// SMTP is considered configured only when a real host (not localhost) and credentials are set.
// Self-hosted instances without a mail server still work — emails are simply skipped.
const smtpConfigured =
  !!process.env["SMTP_HOST"] &&
  process.env["SMTP_HOST"] !== "localhost" &&
  !!process.env["SMTP_USER"];

// Email verification is opt-in: enabled only when SMTP is configured AND
// REQUIRE_EMAIL_VERIFICATION=true is explicitly set. Defaults to false so
// self-hosters without a mail server are not blocked on first run.
const requireEmailVerification =
  smtpConfigured && process.env["REQUIRE_EMAIL_VERIFICATION"] === "true";

async function trySendEmail(fn: () => Promise<void>, context: string): Promise<void> {
  if (!smtpConfigured) return;
  try {
    await fn();
  } catch (err) {
    // Never crash the auth flow because of a mail failure — just log it.
    console.error(`[auth] Failed to send ${context} email:`, err);
  }
}

export const auth = betterAuth({
  baseURL: process.env["APP_URL"] ?? "http://localhost:3000",
  // Falls back to a dev placeholder so the app starts without a secret configured.
  // Changing this in production invalidates all existing sessions.
  secret: process.env["AUTH_SECRET"] ?? "dev-secret-replace-in-production",
  trustedOrigins: [process.env["APP_URL"] ?? "http://localhost:3000"],

  database: drizzleAdapter(db, {
    provider: "pg",
    // better-auth looks up tables by model name (singular).
    // Our Drizzle exports use plural names, so we map them explicitly.
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      organization: organizations,
      member: members,
      invitation: invitations,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    sendResetPassword: async ({ user, url }) => {
      await trySendEmail(async () => {
        await sendEmail({
          to: user.email,
          subject: "Reset your Plani password",
          html: await renderPasswordResetEmail({ url, username: user.name }),
        });
      }, "password-reset");
    },
  },

  emailVerification: {
    sendOnSignUp: smtpConfigured,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await trySendEmail(async () => {
        await sendEmail({
          to: user.email,
          subject: "Verify your Plani account",
          html: await renderVerificationEmail({ url, username: user.name }),
        });
      }, "email-verification");
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

  databaseHooks: {
    user: {
      create: {
        // Automatically promote the very first registered user to instance admin.
        after: async (user) => {
          try {
            const [row] = await db.select({ total: count() }).from(users);
            if (row && Number(row.total) === 1) {
              await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
            }
          } catch (err) {
            console.error("[auth] Failed to check first-user admin promotion:", err);
          }
        },
      },
    },
  },

  plugins: [
    organization({
      sendInvitationEmail: async ({ invitation, inviter, organization: org }) => {
        const baseUrl = process.env["APP_URL"] ?? "http://localhost:3000";
        await trySendEmail(async () => {
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
        }, "invitation");
      },
    }),
    admin(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await trySendEmail(async () => {
          await sendEmail({
            to: email,
            subject: "Your Plani sign-in link",
            html: await renderMagicLinkEmail({ url, email }),
          });
        }, "magic-link");
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
