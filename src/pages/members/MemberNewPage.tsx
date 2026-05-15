import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemberNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => membersService.create({
      email: form.email, password: form.password, fullName: form.fullName,
      phone: form.phone || undefined, address: form.address || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members }); navigate('/members'); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setError(e.response?.data?.message ?? 'Failed to create member'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Member</h1>
        <p className="text-text-secondary text-sm mt-0.5">Register a new library member account</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name <span className="text-danger">*</span></Label>
              <Input value={form.fullName} onChange={set('fullName')} required className="sm:max-w-[50%]" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-danger">*</span></Label>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-danger">*</span></Label>
              <Input type="password" value={form.password} onChange={set('password')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Address <span className="text-text-secondary text-xs">(optional)</span></Label>
              <Input value={form.address} onChange={set('address')} />
            </div>
          </div>

          {error && (
            <div className="border-l-4 border-danger bg-danger/5 px-4 py-2.5 rounded-r-md">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create Member'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/members')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
