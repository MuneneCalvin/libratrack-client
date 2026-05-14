import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Setting { key: string; value: string }

const LABELS: Record<string, string> = {
  fine_rate_per_day: 'Fine Rate Per Day ($)',
  max_borrow_days: 'Max Borrow Days',
  max_books_per_member: 'Max Books Per Member',
  reservation_expiry_days: 'Reservation Expiry Days',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.get('/settings'),
  });

  useEffect(() => {
    const settings = (data?.data as { data?: Setting[] })?.data ?? [];
    setValues(Object.fromEntries(settings.map((s) => [s.key, s.value])));
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.patch('/settings', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Library Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Borrowing Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(LABELS).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input
                type="number"
                value={values[key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
