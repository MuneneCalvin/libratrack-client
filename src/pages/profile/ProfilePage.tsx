import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const displayName = user?.email?.split('@')[0] ?? 'User';
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'librarian' ? 'Librarian' : 'Staff';
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'LT';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary dark:bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary-foreground dark:text-accent">{initials}</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary capitalize">{displayName}</p>
              <Badge variant="secondary" className="mt-1">{roleLabel}</Badge>
            </div>
          </div>

          <div className="divide-y divide-border">
            <div className="flex items-center gap-3 py-3">
              <Mail size={16} className="text-text-secondary shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">Email</p>
                <p className="text-sm text-text-primary">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Shield size={16} className="text-text-secondary shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">Role</p>
                <p className="text-sm text-text-primary">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <User size={16} className="text-text-secondary shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">Account ID</p>
                <p className="text-sm text-text-primary">#{user?.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
