import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { finesService } from '@/services/fines.service';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react';

interface FineRow {
  id: number;
  amount: number;
  reason: string;
  isPaid: boolean;
  isWaived: boolean;
  waivedNote?: string;
  transactionId?: number;
  createdAt: string;
}

export default function PortalFinesPage() {
  const { user } = useAuthStore();
  const memberId = user?.memberId ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.memberFines(memberId),
    queryFn: () => finesService.getByMember(memberId),
    enabled: !!user?.memberId,
  });

  if (!user?.memberId) return <p className="text-text-secondary">Not available.</p>;
  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  const fines = unwrapData<FineRow[]>(data?.data) ?? [];
  const outstanding = fines.filter((fine) => !fine.isPaid && !fine.isWaived);
  const paid = fines.filter((fine) => fine.isPaid);
  const waived = fines.filter((fine) => fine.isWaived);
  const outstandingTotal = outstanding.reduce((sum, fine) => sum + Number(fine.amount), 0);
  const paidTotal = paid.reduce((sum, fine) => sum + Number(fine.amount), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-accent/10 text-accent">
            <ReceiptText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Fines</h1>
            <p className="mt-1 text-sm text-text-secondary">Review outstanding charges, paid fines, and waived items.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FineTile icon={AlertTriangle} label="Outstanding" value={formatCurrency(outstandingTotal)} tone={outstandingTotal > 0 ? 'danger' : 'success'} />
        <FineTile icon={CheckCircle2} label="Paid" value={formatCurrency(paidTotal)} tone="success" />
        <FineTile icon={ShieldCheck} label="Waived" value={waived.length} />
        <FineTile icon={WalletCards} label="Total records" value={fines.length} />
      </div>

      {fines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="font-semibold text-text-primary">No fines on your account</p>
              <p className="mt-1 text-sm text-text-secondary">Returned books and paid charges will appear here when recorded.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {fines.map((fine) => {
            const isOutstanding = !fine.isPaid && !fine.isWaived;
            return (
              <Card key={fine.id} className={isOutstanding ? 'ring-danger/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-full ${isOutstanding ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
                        {isOutstanding ? <AlertTriangle size={19} /> : <ReceiptText size={19} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xl font-bold ${isOutstanding ? 'text-danger' : 'text-text-primary'}`}>
                          {formatCurrency(Number(fine.amount))}
                        </p>
                        <p className="mt-1 text-sm text-text-primary">{fine.reason}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Recorded {formatDate(fine.createdAt)}
                          {fine.transactionId ? ` · Transaction #${fine.transactionId}` : ''}
                        </p>
                        {fine.waivedNote && (
                          <p className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-text-secondary">
                            {fine.waivedNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <FineStatusBadge fine={fine} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FineTile({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'danger';
}) {
  const toneClass = tone === 'success' ? 'bg-success/10 text-success' : tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent';

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid size-10 place-items-center rounded-full ${toneClass}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FineStatusBadge({ fine }: { fine: FineRow }) {
  if (fine.isPaid) return <Badge variant="secondary">Paid</Badge>;
  if (fine.isWaived) return <Badge variant="outline">Waived</Badge>;
  return <Badge variant="destructive">Unpaid</Badge>;
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
