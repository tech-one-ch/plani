"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@plani/ui";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const { data: session } = authClient.useSession();

  async function resend() {
    if (!session?.user.email) return;
    setResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: "/dashboard",
    });
    setResending(false);
    if (error) {
      toast.error(error.message ?? "Failed to resend verification email");
    } else {
      toast.success("Verification email sent!");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your inbox</CardTitle>
        <CardDescription>
          We sent a verification link to{" "}
          <strong>{session?.user.email ?? "your email address"}</strong>. Click it to activate your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-zinc-500">
          Didn&apos;t receive it? Check your spam folder or resend below.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void resend()}
          disabled={resending}
        >
          {resending ? "Sending…" : "Resend verification email"}
        </Button>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
