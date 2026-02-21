'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (result?.error) {
        // NextAuth returns "CredentialsSignin" as a generic error code
        const errorMessage = result.error === 'CredentialsSignin'
          ? 'Invalid email or password. Please try again.'
          : result.error;
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 100);
      } else {
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-icon.png" alt="Radiator Routes" width={40} height={40} className="rounded-lg" />
          <span className={`${luckiestGuy.className} text-2xl text-rs-terracotta`}>Radiator Routes</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-rs-sand-dark/25 shadow-xl shadow-rs-terracotta/5 p-7 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-rs-deep-brown mb-1.5">Welcome back</h1>
          <p className="text-rs-desert-brown text-sm">Sign in to continue planning your trips</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="h-4 w-4" />}
            required
            disabled={isLoading}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              icon={<Lock className="h-4 w-4" />}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-rs-desert-brown/40 hover:text-rs-terracotta transition-colors p-1"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-rs-desert-brown">
              <input type="checkbox" className="rounded border-rs-sand-dark text-rs-terracotta focus:ring-rs-terracotta w-3.5 h-3.5" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-rs-terracotta hover:underline font-medium">
              Forgot?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 mt-1"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin h-4 w-4" /> Signing in...
              </span>
            ) : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rs-sand-dark/25" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-rs-desert-brown/50 uppercase tracking-wider">or</span>
          </div>
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-rs-sand-dark/25 rounded-xl text-sm font-medium text-rs-deep-brown hover:bg-rs-sand-light transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.08 5.08 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09a6.97 6.97 0 010-4.18V7.07H2.18A11.99 11.99 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-rs-sand-dark/25 rounded-xl text-sm font-medium text-rs-deep-brown hover:bg-rs-sand-light transition-colors">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            GitHub
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-rs-desert-brown mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-rs-terracotta font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
};