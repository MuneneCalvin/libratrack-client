import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy brand (desktop only) */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col items-center justify-center bg-sidebar-bg relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 50%, hsl(42 72% 52% / 0.08), transparent 70%)',
        }}
      >
        {/* Decorative faint book spines */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm bg-white/3"
              style={{
                width: `${12 + i * 4}px`,
                height: `${80 + i * 20}px`,
                left: `${10 + i * 15}%`,
                bottom: `${10 + (i % 3) * 8}%`,
                transform: `rotate(${-3 + i * 1.5}deg)`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-12">
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
            <BookOpen size={48} className="text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">LibraTrack</h1>
          <p className="text-white/50 text-lg">Computerized Book Management</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <BookOpen size={24} className="text-accent" />
          <span className="text-xl font-bold text-text-primary">LibraTrack</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-secondary text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-text-secondary text-center mt-6">
            New library member?{' '}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Create member account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
