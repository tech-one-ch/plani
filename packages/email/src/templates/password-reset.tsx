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

interface PasswordResetEmailProps {
  url: string;
  username?: string;
}

export function PasswordResetEmail({ url, username }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Plani password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            {username ? `Hi ${username},` : "Hi,"} we received a request to reset the password for
            your Plani account.
          </Text>
          <Section style={buttonSection}>
            <Button href={url} style={button}>
              Reset password
            </Button>
          </Section>
          <Text style={hint}>
            This link expires in 1 hour. If you did not request a password reset, you can safely
            ignore this email — your password will not be changed.
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
