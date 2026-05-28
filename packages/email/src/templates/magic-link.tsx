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

interface MagicLinkEmailProps {
  url: string;
  email: string;
}

export function MagicLinkEmail({ url, email }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Plani sign-in link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to Plani</Heading>
          <Text style={text}>
            We received a sign-in request for <strong>{email}</strong>. Click the button below to
            sign in — no password needed.
          </Text>
          <Section style={buttonSection}>
            <Button href={url} style={button}>
              Sign in to Plani
            </Button>
          </Section>
          <Text style={hint}>
            This link expires in 10 minutes and can only be used once. If you did not request this
            link, you can safely ignore this email.
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
