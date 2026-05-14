import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const variantStyles = {
  default: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export default function StatsCard({ title, value, icon: Icon, variant = 'default', subtitle }: Props) {
  return (
    <Card className="bg-surface border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('p-3 rounded-lg bg-background', variantStyles[variant])}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
