import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { UserPlus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PASSWORD = 'Library@1234';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddMemberModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', address: '', password: DEFAULT_PASSWORD });
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState<{ membershipNumber: string } | null>(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => membersService.create({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone || undefined,
      address: form.address || undefined,
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      const member = unwrapCreatedMember(res?.data);
      setSuccess({ membershipNumber: member?.membershipNumber ?? '' });
      toast.success('Member created');
    },
    onError: () => {
      setError('Failed to create member. Email may already be in use.');
      toast.error('Failed to create member');
    },
  });

  function handleClose() {
    setForm({ email: '', fullName: '', phone: '', address: '', password: DEFAULT_PASSWORD });
    setSuccess(null);
    setError('');
    onClose();
  }

  function copyPassword() {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    toast.success('Password copied');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-accent/10">
              <UserPlus size={20} className="text-accent" />
            </div>
            <DialogTitle>Add New Member</DialogTitle>
          </div>
          <DialogDescription>
            Create a new library member account. They will be prompted to change their password on first login.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-2">
              <p className="font-semibold text-green-700 dark:text-green-400">Member created successfully!</p>
              <p className="text-sm text-text-secondary">Membership #: <span className="font-mono font-medium text-text-primary">{success.membershipNumber}</span></p>
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">Default password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface px-3 py-1.5 rounded text-sm font-mono border border-border">{form.password}</code>
                  <Button type="button" variant="outline" size="sm" onClick={copyPassword} className="gap-1.5 shrink-0">
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-text-secondary">Share these credentials with the member. They must change their password on first login.</p>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add-fullname">Full Name *</Label>
                <Input id="add-fullname" value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Jane Doe" required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add-email">Email *</Label>
                <Input id="add-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254 712 345 678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-address">Address</Label>
                <Input id="add-address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Nairobi, Kenya" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add-password">Default Password</Label>
                <PasswordInput id="add-password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                <p className="text-xs text-text-secondary">Member will be required to change this on first login.</p>
              </div>
            </div>

            {error && (
              <div className="border-l-4 border-danger bg-danger/5 px-3 py-2 rounded-r-md">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create Member'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function unwrapCreatedMember(payload: unknown): { membershipNumber?: string } | undefined {
  const data = payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data?: unknown }).data
    : payload;

  if (data && typeof data === 'object' && 'member' in data) {
    return (data as { member?: { membershipNumber?: string } }).member;
  }

  return data as { membershipNumber?: string } | undefined;
}
