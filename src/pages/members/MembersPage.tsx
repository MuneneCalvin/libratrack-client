import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { membersService, type Member } from '@/services/members.service';
import { QUERY_KEYS } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/lib/utils';
import AddMemberModal from '@/components/modals/AddMemberModal';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members }),
  });

  const columns = [
    { key: 'name', header: 'Name', render: (m: Member) => <span className="font-medium">{m.fullName}</span> },
    { key: 'membership', header: 'Membership #', render: (m: Member) => <span className="text-text-secondary text-sm font-mono">{m.membershipNumber}</span> },
    { key: 'email', header: 'Email', render: (m: Member) => m.email },
    { key: 'joined', header: 'Joined', render: (m: Member) => formatDate(m.joinedAt) },
    { key: 'status', header: 'Status', render: (m: Member) => (
      <Badge variant={m.isActive ? 'default' : 'secondary'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions', header: '', render: (m: Member) => (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/members/${m.id}`)}><Eye size={15} /></Button>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Members</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus size={16} /> Add Member</Button>
      </div>
      <Input placeholder="Search by name or membership number…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-sm" />
      <DataTable
        columns={columns}
        data={(data?.data as { data?: Member[] })?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={(data?.data as { meta?: { totalPages?: number } })?.meta?.totalPages}
        onPageChange={setPage}
      />
    </div>
    </>
  );
}
