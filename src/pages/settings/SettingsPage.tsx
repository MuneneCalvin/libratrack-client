import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Clock, BookOpen, Users, CalendarDays } from 'lucide-react';

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
    queryFn: () => api.get('/settings'),
  });

  useEffect(() => {
    const settings = (data?.data as { data?: Record<string, string> })?.data;
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      setValues(settings);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.patch('/settings', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Library Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Configure borrowing rules and library policies</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-accent" />
            <CardTitle className="text-base">Borrowing Rules</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SETTINGS.map(({ key, label, description, icon: Icon, prefix, suffix }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-accent shrink-0" />
                  <Label>{label}</Label>
                </div>
                <p className="text-xs text-text-secondary">{description}</p>
                <div className="flex items-center gap-2">
                  {prefix && <span className="text-sm text-text-secondary shrink-0">{prefix}</span>}
                  <Input
                    type="number"
                    value={values[key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="max-w-xs"
                  />
                  {suffix && <span className="text-sm text-text-secondary shrink-0">{suffix}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
            </Button>
            {saved && <span className="text-sm text-green-600">Settings updated successfully.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
