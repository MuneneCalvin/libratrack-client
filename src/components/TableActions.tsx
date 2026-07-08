import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ActionTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface TableActionButtonProps {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: ActionTone;
  iconOnly?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const toneClass: Record<ActionTone, string> = {
  neutral: 'border-border bg-surface text-text-secondary hover:border-primary/20 hover:bg-surface-hover hover:text-text-primary',
  accent: 'border-accent/25 bg-accent/10 text-accent hover:border-accent/45 hover:bg-accent/15',
  success: 'border-success/25 bg-success/10 text-success hover:border-success/45 hover:bg-success/15',
  warning: 'border-warning/25 bg-warning/10 text-warning hover:border-warning/45 hover:bg-warning/15',
  danger: 'border-danger/25 bg-danger/10 text-danger hover:border-danger/45 hover:bg-danger/15',
};

export function TableActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-1.5">{children}</div>;
}

export function TableActionButton({
  label,
  icon: Icon,
  tone = 'neutral',
  iconOnly = false,
  disabled = false,
  onClick,
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold shadow-sm transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:pointer-events-none disabled:opacity-50',
        iconOnly && 'size-8 px-0',
        toneClass[tone],
      )}
    >
      <Icon size={14} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
