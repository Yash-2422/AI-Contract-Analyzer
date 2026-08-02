import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/auth-store";
import type { TokenResponse, User } from "@/types/api";

// Mirrors backend/app/schemas/user.py::UserRegisterRequest exactly - the
// backend is still the source of truth and will reject anything this
// misses, but matching it here means the person sees the real rule before
// they submit, not after a round trip.
const registerSchema = z.object({
  full_name: z.string().min(1, "Enter your name.").max(255),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
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

      // Registration doesn't return tokens (Phase 2's /auth/register just
      // creates the account), so log in immediately after to get the user
      // straight into the app instead of bouncing them to a login form
      // they'd have to fill out again.
      const { data: tokens } = await apiClient.post<TokenResponse>("/auth/login", {
        email: values.email,
        password: values.password,
      });
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);

      const { data: user } = await apiClient.get<User>("/auth/me");
      setSession(tokens.access_token, tokens.refresh_token, user);

      navigate("/dashboard");
    } catch (err) {
      setServerError(getErrorMessage(err, "Could not create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start reviewing contracts with AI.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                autoComplete="name"
                invalid={!!errors.full_name}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-sm text-risk-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-risk-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-risk-600">{errors.password.message}</p>
              )}
              <p className="text-xs text-ink-400">At least 8 characters.</p>
            </div>

            {serverError && (
              <p role="alert" className="text-sm text-risk-600">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}