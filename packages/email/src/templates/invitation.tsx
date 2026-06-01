import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InvitationEmailProps {
  url: string;
  inviterName: string;
  organizationName: string;
  role: string;
  recipientEmail: string;
}

export function InvitationEmail({
  url,
  inviterName,
  organizationName,
  role,
  recipientEmail,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on Plani
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;ve been invited</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited <strong>{recipientEmail}</strong> to join{" "}
            <strong>{organizationName}</strong> on Plani as a <strong>{role}</strong>.
          </Text>
          <Section style={buttonSection}>
            <Button href={url} style={button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={hint}>
            This invitation expires in 48 hours. If you were not expecting this invitation, you can
            safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Or copy and paste this URL: <span style={link}>{url}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "520px",
};
const h1 = { fontSize: "24px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 16px" };
const text = { fontSize: "16px", color: "#444", lineHeight: "24px", margin: "0 0 24px" };
const buttonSection = { textAlign: "center" as const, margin: "0 0 24px" };
const button = {
  backgroundColor: "#18181b",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "15px",
  textDecoration: "none",
};
const hint = { fontSize: "13px", color: "#888", margin: "0 0 24px" };
const hr = { borderColor: "#e4e4e7", margin: "0 0 16px" };
const footer = { fontSize: "12px", color: "#aaa", wordBreak: "break-all" as const };
const link = { color: "#18181b" };
