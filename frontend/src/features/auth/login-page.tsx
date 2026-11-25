import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2, LockKeyhole } from "lucide-react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Eyebrow } from "@/components/ui/page-shell";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/auth-store";
import type { TokenResponse, User } from "@/types/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-risk-600">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { data: tokens } = await apiClient.post<TokenResponse>("/auth/login", values);

      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);

      const { data: user } = await apiClient.get<User>("/auth/me");
      useAuthStore.getState().setSession(tokens.refresh_token, user);

      navigate("/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Incorrect email or password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <Eyebrow className="mb-4">Welcome back</Eyebrow>
        <h1 className="font-display text-[2.55rem] font-medium leading-[1.02] tracking-[-0.03em] text-ink-900 sm:text-[2.8rem]">
          Sign in to your
          <br />
          <span className="italic text-primary">reading room.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-400">
          Your contracts, analyses, and conversations are exactly where you left
          them.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email
            <span className="font-mono text-[0.6rem] font-normal uppercase tracking-[0.12em] text-ink-400">
              Required
            </span>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@firm.com"
            invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <div id="email-error">
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <div id="password-error">
            <FieldError message={errors.password?.message} />
          </div>
        </div>

        {serverError && (
          <Alert tone="error" className="text-xs">
            {serverError}
          </Alert>
        )}

        <Button type="submit" className="group w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="hairline flex-1" />
        <span className="rule-label">New here?</span>
        <span className="hairline flex-1" />
      </div>

      <p className="mt-5 text-center text-sm text-ink-400">
        Create a workspace in under a minute.{" "}
        <Link
          to="/register"
          className="font-medium text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 flex items-center justify-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-400">
        <LockKeyhole className="h-3 w-3" />
        Encrypted authentication · Private by default
      </p>
    </AuthLayout>
  );
}
