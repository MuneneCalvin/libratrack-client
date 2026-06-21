import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPasswordForm() {
  const { patchUser } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => authService.changePassword(password),
    onSuccess: () => {
      patchUser({ mustChangePassword: false });
      setPassword('');
      setConfirm('');
      toast.success('Password updated');
    },
    onError: () => {
      toast.error('Failed to update password');
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <KeyRound size={18} />
        </div>
        <div>
          <p className="font-semibold text-text-primary">Reset password</p>
          <p className="mt-1 text-sm text-text-secondary">Set a new password for this account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account-new-password">New password</Label>
          <PasswordInput
            id="account-new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-confirm-password">Confirm password</Label>
          <PasswordInput
            id="account-confirm-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-r-md border-l-4 border-danger bg-danger/5 px-3 py-2">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Updating...' : 'Update password'}
        </Button>
      </div>
    </form>
  );
}
