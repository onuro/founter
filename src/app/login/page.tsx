'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/generator';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-md bg-surface flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          Founter
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter the password to access internal tools
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="pr-12"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded bg-input border-0 text-primary focus:ring-primary focus:ring-offset-background accent-primary"
            disabled={isLoading}
          />
          <Label
            htmlFor="rememberMe"
            className="text-muted-foreground"
          >
            Remember me for 30 days
          </Label>
        </div>

        {error && (
          <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive-fg">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading || !password}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Sign In
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Need access?{' '}
        <a href="mailto:hello@fountn.design" className="underline hover:text-foreground transition-colors">
          Contact admin
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-sm flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
