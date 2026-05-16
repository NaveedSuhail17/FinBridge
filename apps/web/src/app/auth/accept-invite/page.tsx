'use client';

import { Suspense, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, useAuthStore } from '@finbridge/sdk';
import { AuthLayout, Button, Input, Label } from '@finbridge/ui';

interface FormData {
  name: string;
  password: string;
  confirmPassword: string;
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const password = useWatch({ control, name: 'password', defaultValue: '' });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const tokens = await authService.acceptInvite({
        token,
        name: data.name,
        password: data.password,
      });
      setAuth({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user });
      router.push('/dashboard');
    } catch {
      setError('Invalid or expired invite link. Please request a new one.');
    }
  };

  if (!token) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        This invite link is missing or invalid. Please check the link from your email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          placeholder="Jane Smith"
          autoComplete="name"
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'At least 2 characters' },
          })}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Set password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          })}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Activating account…' : 'Activate account'}
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <AuthLayout
      title="Accept your invitation"
      subtitle="Set up your FinBridge account to get started"
    >
      <Suspense fallback={<div className="h-48 animate-pulse rounded bg-muted" />}>
        <AcceptInviteForm />
      </Suspense>
    </AuthLayout>
  );
}
