import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { membersService, type Member } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/lib/utils';
import AddMemberModal from '@/components/modals/AddMemberModal';
import { toast } from 'sonner';
import { MemberAvatar } from '@/components/CatalogVisuals';

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.members, page, q],
    queryFn: () => membersService.getAll({ page, limit: 20, q: q || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: membersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      toast.success('Member deleted');
    },
    onError: () => {
      toast.error('Failed to delete member');
    },
  });
  const toggleMutation = useMutation({
    mutationFn: (member: Member) => membersService.update(member.id, { isActive: !member.isActive }),
    onSuccess: (_, member) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      toast.success(member.isActive ? 'Member access revoked' : 'Member access restored', {
        description: member.fullName,
      });
    },
    onError: () => {
      toast.error('Failed to update member access');
    },
  });

  const members = (data?.data as { data?: Member[] })?.data ?? [];
  const meta = (data?.data as { meta?: { totalPages?: number; total?: number } })?.meta;
  const activeCount = members.filter((member) => member.isActive).length;

  const columns = [
    { key: 'name', header: 'Name', sortValue: (m: Member) => m.fullName, render: (m: Member) => (
      <div className="flex items-center gap-3">
        <MemberAvatar name={m.fullName} />
        <div className="min-w-0">
          <p className="truncate font-medium">{m.fullName}</p>
          <p className="text-xs text-text-secondary">{m.membershipNumber}</p>
        </div>
      </div>
    ) },
    { key: 'membership', header: 'Membership #', sortValue: (m: Member) => m.membershipNumber, render: (m: Member) => <span className="text-text-secondary text-sm font-mono">{m.membershipNumber}</span> },
    { key: 'email', header: 'Email', sortValue: (m: Member) => m.email, render: (m: Member) => m.email },
    { key: 'phone', header: 'Phone', sortValue: (m: Member) => m.phone ?? '', render: (m: Member) => <span className="text-text-secondary text-sm">{m.phone || '—'}</span> },
    { key: 'joined', header: 'Joined', sortValue: (m: Member) => m.joinedAt, render: (m: Member) => formatDate(m.joinedAt) },
    { key: 'status', header: 'Status', sortValue: (m: Member) => m.isActive ? 'Active' : 'Inactive', render: (m: Member) => (
      <Badge variant={m.isActive ? 'default' : 'secondary'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions', header: '', render: (m: Member) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/members/${m.id}`)}><Eye size={15} /></Button>
        <Button
          variant="ghost"
          size="sm"
          className={m.isActive ? 'text-danger' : 'text-success'}
          onClick={() => toggleMutation.mutate(m)}
          disabled={toggleMutation.isPending}
        >
          {m.isActive ? 'Revoke' : 'Restore'}
        </Button>
        {user?.role === 'admin' && (
          <Button variant="ghost" size="icon" className="text-danger" onClick={() => { if (confirm('Delete member?')) deleteMutation.mutate(m.id); }}>
            <Trash2 size={15} />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <>
    <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Members</h1>
          <p className="mt-1 text-sm text-text-secondary">Member profiles, account access, and library activity.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="w-full gap-2 sm:w-auto"><Plus size={16} /> Add Member</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Users} label="Matching members" value={meta?.total ?? members.length} />
        <MetricCard icon={UserCheck} label="Active on this page" value={activeCount} />
        <MetricCard icon={UserX} label="Revoked on this page" value={members.length - activeCount} />
      </div>

      <div className="rounded-md border border-border bg-surface p-3">
        <Input
          placeholder="Search by name or membership number…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="w-full"
        />
      </div>
      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        page={page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
      />
    </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-accent/10 p-2">
          <Icon size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
