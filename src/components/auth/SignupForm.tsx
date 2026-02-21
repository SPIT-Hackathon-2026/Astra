'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const SignupForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.error || 'Something went wrong' });
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-2xl border border-rs-sand-dark/25 shadow-xl p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-7 w-7 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-rs-deep-brown mb-2">Account Created</h2>
          <p className="text-rs-desert-brown text-sm mb-1">You&apos;re all set. Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-rs-deep-brown mb-1.5">Create your account</h1>
          <p className="text-rs-desert-brown text-sm">Start planning incredible road trips</p>
        </div>

        {errors.general && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="text" label="Full name" placeholder="Your name" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name}
            icon={<User className="h-4 w-4" />} required />

          <Input type="email" label="Email" placeholder="you@example.com" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email}
            icon={<Mail className="h-4 w-4" />} required />

          <Input type="password" label="Password" placeholder="Min. 6 characters" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={errors.password}
            icon={<Lock className="h-4 w-4" />} required />

          <Input type="password" label="Confirm password" placeholder="••••••••" value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} error={errors.confirmPassword}
            icon={<Lock className="h-4 w-4" />} required />

          <div className="flex items-start gap-2">
            <input type="checkbox" required className="rounded border-rs-sand-dark text-rs-terracotta focus:ring-rs-terracotta mt-0.5 w-3.5 h-3.5" />
            <label className="text-xs text-rs-desert-brown leading-relaxed">
              I agree to the <Link href="/terms" className="text-rs-terracotta font-medium hover:underline">Terms</Link> and <Link href="/privacy" className="text-rs-terracotta font-medium hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3.5 mt-1" isLoading={isLoading} disabled={isLoading}>
            Create account
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-rs-desert-brown mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-rs-terracotta font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
};