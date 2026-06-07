"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label } from "@plani/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";

const schema = z
  .object({
    name: z.string().min(2, "At least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function SetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message ?? "Failed to create account");
      return;
    }

    const res = await fetch("/api/setup", { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      toast.error("Setup step failed — please try again");
      return;
    }

    toast.success("Admin account created! Welcome to Plani.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          {...register("confirm")}
        />
        {errors.confirm && (
          <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
            {errors.confirm.message}
          </p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Get started →"}
        </Button>
      </div>
    </form>
  );
}
