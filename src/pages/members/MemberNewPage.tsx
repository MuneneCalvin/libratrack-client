import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function MemberNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => membersService.create({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone || undefined, address: form.address || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members }); navigate('/members'); },
    onError: (e: { response?: { data?: { message?: string } } }) => setError(e.response?.data?.message ?? 'Failed to create member'),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Add Member</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1"><Label>Full Name</Label><Input value={form.fullName} onChange={set('fullName')} required /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} required /></div>
          <div className="space-y-1"><Label>Password</Label><Input type="password" value={form.password} onChange={set('password')} required /></div>
          <div className="space-y-1"><Label>Phone (optional)</Label><Input value={form.phone} onChange={set('phone')} /></div>
          <div className="space-y-1"><Label>Address (optional)</Label><Input value={form.address} onChange={set('address')} /></div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Create Member'}</Button>
            <Button variant="outline" onClick={() => navigate('/members')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
