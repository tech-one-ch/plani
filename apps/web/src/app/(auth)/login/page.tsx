"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@plani/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: "/dashboard",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function onMagicLink() {
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setLoading(true);
    const { error } = await signIn.magicLink({ email, callbackURL: "/dashboard" });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Failed to send magic link");
    } else {
      toast.success("Magic link sent — check your inbox");
    }
  }

  async function onGoogle() {
    await signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Plani account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/reset-password"
                className="text-xs hover:underline"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span
              className="w-full border-t"
              style={{ borderColor: "var(--color-border-default)" }}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span
              className="px-2"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-muted)",
              }}
            >
              or
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void onMagicLink()}
            disabled={loading}
          >
            Send magic link
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void onGoogle()}
            disabled={loading}
          >
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium hover:underline"
            style={{ color: "var(--color-text-primary)" }}
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
