"use client";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@plani/ui";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    async function fetchInvitation() {
      const result = await authClient.organization.getInvitation({
        query: { id: params.token },
      });
      if (result.data) setOrgName(result.data.organizationName);
    }
    fetchInvitation().catch(() => {});
  }, [params.token]);

  async function accept() {
    if (!session) {
      router.push(`/login?callbackUrl=/invite/${params.token}`);
      return;
    }
    setLoading(true);
    const { error } = await authClient.organization.acceptInvitation({
      invitationId: params.token,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to accept invitation");
    } else {
      toast.success(`Joined ${orgName ?? "the organization"}!`);
      router.push("/dashboard");
    }
  }

  async function decline() {
    setLoading(true);
    await authClient.organization.rejectInvitation({ invitationId: params.token });
    setLoading(false);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You&apos;ve been invited</CardTitle>
          <CardDescription>
            {orgName ? `Join ${orgName} on Plani` : "You have a pending invitation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!session && (
            <p className="text-center text-sm text-zinc-500">
              You&apos;ll need to sign in or create an account to accept this invitation.
            </p>
          )}
          <Button className="w-full" onClick={() => void accept()} disabled={loading}>
            {loading ? "Accepting…" : "Accept invitation"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => void decline()}
            disabled={loading}
          >
            Decline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
