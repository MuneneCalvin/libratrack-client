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

const variantConfig = {
  default: {
    text: 'text-accent',
    border: 'border-l-accent',
    iconBg: 'bg-gradient-to-br from-accent/20 to-accent/5',
  },
  success: {
    text: 'text-success',
    border: 'border-l-success',
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
  },
  warning: {
    text: 'text-warning',
    border: 'border-l-warning',
    iconBg: 'bg-gradient-to-br from-warning/20 to-warning/5',
  },
  danger: {
    text: 'text-danger',
    border: 'border-l-danger',
    iconBg: 'bg-gradient-to-br from-danger/20 to-danger/5',
  },
};

export default function StatsCard({ title, value, icon: Icon, variant = 'default', subtitle }: Props) {
  const cfg = variantConfig[variant];

  return (
    <Card className={cn(
      'bg-surface border-l-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5',
      cfg.border
    )}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('p-3 rounded-full shrink-0', cfg.iconBg, cfg.text)}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
