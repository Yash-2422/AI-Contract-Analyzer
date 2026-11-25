import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

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

const registerSchema = z.object({
  full_name: z.string().min(1, "Enter your name.").max(255),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-risk-600">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await apiClient.post<User>("/auth/register", values);

      // Registration doesn't return tokens (the backend's /auth/register
      // only creates the account), so log in immediately after to get the
      // user straight into the app instead of bouncing them to a login form.
      const { data: tokens } = await apiClient.post<TokenResponse>("/auth/login", {
        email: values.email,
        password: values.password,
      });
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);

      const { data: user } = await apiClient.get<User>("/auth/me");
      useAuthStore.getState().setSession(tokens.refresh_token, user);

      navigate("/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <Eyebrow className="mb-4">Create workspace</Eyebrow>
        <h1 className="font-display text-[2.55rem] font-medium leading-[1.02] tracking-[-0.03em] text-ink-900 sm:text-[2.8rem]">
          Begin your first
          <br />
          <span className="italic text-primary">close read.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-400">
          One quiet workspace for every contract you need to understand.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            autoFocus
            placeholder="Alex Morgan"
            invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? "name-error" : undefined}
            {...register("full_name")}
          />
          <div id="name-error">
            <FieldError message={errors.full_name?.message} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
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
          <Label htmlFor="password">
            Password
            <span className="font-mono text-[0.6rem] font-normal uppercase tracking-[0.12em] text-ink-400">
              8+ characters
            </span>
          </Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Choose a password"
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
              Creating workspace…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="hairline flex-1" />
        <span className="rule-label">Already a member?</span>
        <span className="hairline flex-1" />
      </div>

      <p className="mt-5 text-center text-sm text-ink-400">
        Sign in to continue your work.{" "}
        <Link
          to="/login"
          className="font-medium text-accent underline-offset-4 transition-colors hover:text-accent-hover hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-8 flex items-center justify-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-400">
        <ShieldCheck className="h-3 w-3" />
        Private workspace · No card required
      </p>
    </AuthLayout>
  );
}
