import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authService, type AuthUser } from '@/services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccountPasswordForm from '@/components/AccountPasswordForm';
import { User, Mail, Shield, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, patchUser } = useAuthStore();
  const [email, setEmail] = useState(user?.email ?? '');

  const updateMutation = useMutation({
    mutationFn: () => authService.updateMe({ email }),
    onSuccess: (response) => {
      const updatedUser = unwrapData<AuthUser>(response.data);
      if (updatedUser?.email) patchUser({ email: updatedUser.email });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const displayName = user?.email?.split('@')[0] ?? 'User';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'librarian' ? 'Librarian' : 'Staff';
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'LT';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary shadow-sm ring-2 ring-accent/15 dark:bg-accent/20">
            <span className="text-xl font-bold text-primary-foreground dark:text-accent">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary capitalize">{displayName}</h1>
            <Badge variant="secondary" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.75fr)]">
        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={17} className="text-accent" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="staff-profile-email">Email</Label>
                <Input
                  id="staff-profile-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="gap-2" disabled={updateMutation.isPending || !email}>
                  <Save size={15} />
                  {updateMutation.isPending ? 'Saving...' : 'Save details'}
                </Button>
              </div>
            </form>

            <div className="divide-y divide-border rounded-lg border border-border">
              <InfoRow icon={Mail} label="Email" value={user?.email ?? '—'} />
              <InfoRow icon={Shield} label="Role" value={roleLabel} />
              <InfoRow icon={User} label="Account ID" value={`#${user?.id}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="border-b border-border bg-surface-hover/40 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound size={17} className="text-accent" /> Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AccountPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
