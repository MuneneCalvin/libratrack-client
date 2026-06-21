import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Clock, BookOpen, Users, CalendarDays, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Setting {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
}

const SETTINGS: Setting[] = [
  { key: 'fine_rate_per_day', label: 'Fine Rate Per Day', description: 'Daily fine charged for overdue books', icon: Clock, prefix: 'KES' },
  { key: 'max_borrow_days', label: 'Max Borrow Days', description: 'Maximum number of days a member can borrow books', icon: CalendarDays, suffix: 'days' },
  { key: 'max_books_per_member', label: 'Max Books Per Member', description: 'Maximum books a member can borrow at once', icon: BookOpen, suffix: 'books' },
  { key: 'reservation_expiry_days', label: 'Reservation Expiry', description: 'Days before an unfulfilled reservation expires', icon: Users, suffix: 'days' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.get('/settings/'),
  });

  useEffect(() => {
    const settings = unwrapData<Record<string, string>>(data?.data);
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(settings);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.put('/settings/', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      setSaved(true);
      toast.success('Settings saved');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;
  const fineRate = values.fine_rate_per_day ? `KES ${values.fine_rate_per_day}` : 'Not set';
  const borrowDays = values.max_borrow_days ? `${values.max_borrow_days} days` : 'Not set';
  const memberLimit = values.max_books_per_member ? `${values.max_books_per_member} books` : 'Not set';
  const reservationWindow = values.reservation_expiry_days ? `${values.reservation_expiry_days} days` : 'Not set';

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <ShieldCheck size={13} /> Policy controls
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Library Settings</h1>
            <p className="text-text-secondary text-sm mt-1">Configure borrowing rules, fines, and reservation windows.</p>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
            <Save size={16} />
            {mutation.isPending ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryTile icon={Clock} label="Daily fine" value={fineRate} />
        <SummaryTile icon={CalendarDays} label="Loan period" value={borrowDays} />
        <SummaryTile icon={BookOpen} label="Borrow limit" value={memberLimit} />
        <SummaryTile icon={Users} label="Reservation hold" value={reservationWindow} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-surface-hover/40">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-accent/10 p-2">
              <Settings2 size={18} className="text-accent" />
            </div>
            <div>
              <CardTitle className="text-base">Borrowing Rules</CardTitle>
              <p className="mt-1 text-xs text-text-secondary">These values control member limits, due dates, and overdue fine calculation.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {SETTINGS.map(({ key, label, description, icon: Icon, prefix, suffix }) => (
              <div key={key} className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-accent/10 p-2 text-accent">
                    <Icon size={17} />
                  </div>
                  <div>
                    <Label className="font-semibold">{label}</Label>
                    <p className="mt-1 text-sm text-text-secondary">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  {prefix && <span className="text-sm font-medium text-text-secondary shrink-0">{prefix}</span>}
                  <Input
                    type="number"
                    value={values[key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  {suffix && <span className="text-sm font-medium text-text-secondary shrink-0">{suffix}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-hover/30 px-4 py-3">
            <span className="text-sm text-text-secondary">
              {saved ? 'Settings updated successfully.' : 'Changes apply after saving.'}
            </span>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
              <Save size={15} />
              {mutation.isPending ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-accent/10 p-2">
          <Icon size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="text-lg font-bold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function unwrapData<T>(payload: unknown): T | undefined {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data;
  }
  return payload as T | undefined;
}
