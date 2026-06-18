import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { BookOpen } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(message?.message ?? Object.values(message?.errors ?? {})[0]?.[0] ?? 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center bg-sidebar-bg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-12">
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
            <BookOpen size={48} className="text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">LibraTrack</h1>
          <p className="text-white/50 text-lg max-w-md">
            Join the library portal to reserve books, track fines, and manage your borrowing history.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <BookOpen size={24} className="text-accent" />
          <span className="text-xl font-bold text-text-primary">LibraTrack</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Create member account</h2>
            <p className="text-text-secondary text-sm mt-1">Sign up to access the member portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signup-full-name">Full Name</Label>
              <Input
                id="signup-full-name"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <PasswordInput
                  id="signup-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <PasswordInput
                  id="signup-confirm-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Repeat password"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-phone">Phone</Label>
                <Input
                  id="signup-phone"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+254 712 345 678"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-address">Address</Label>
                <Input
                  id="signup-address"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="Nairobi, Kenya"
                />
              </div>
            </div>

            {error && (
              <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
