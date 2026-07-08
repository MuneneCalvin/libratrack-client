import { AlertTriangle, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmTone = 'danger' | 'warning' | 'success';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const toneMap: Record<ConfirmTone, { icon: typeof AlertTriangle; eyebrow: string; iconClass: string; shellClass: string; railClass: string; buttonClass: string }> = {
  danger: {
    icon: Trash2,
    eyebrow: 'Permanent action',
    iconClass: 'bg-danger/10 text-danger ring-danger/15',
    shellClass: 'from-danger/10 via-surface to-surface',
    railClass: 'bg-danger',
    buttonClass: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/20',
  },
  warning: {
    icon: ShieldAlert,
    eyebrow: 'Access change',
    iconClass: 'bg-accent/10 text-accent ring-accent/20',
    shellClass: 'from-accent/10 via-surface to-surface',
    railClass: 'bg-accent',
    buttonClass: 'bg-accent text-primary hover:bg-accent/90 focus-visible:ring-accent/20',
  },
  success: {
    icon: CheckCircle2,
    eyebrow: 'Restore access',
    iconClass: 'bg-success/10 text-success ring-success/20',
    shellClass: 'from-success/10 via-surface to-surface',
    railClass: 'bg-success',
    buttonClass: 'bg-success text-white hover:bg-success/90 focus-visible:ring-success/20',
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'warning',
  isPending = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const toneConfig = toneMap[tone];
  const Icon = toneConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[30rem] overflow-y-auto rounded-2xl border border-border/80 bg-surface p-0 shadow-2xl shadow-primary/15" showCloseButton={!isPending}>
        <div className={cn('relative bg-gradient-to-br p-5 pb-4', toneConfig.shellClass)}>
          <div className={cn('absolute inset-x-0 top-0 h-1', toneConfig.railClass)} />
          <div className="flex gap-4">
            <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 shadow-sm', toneConfig.iconClass)}>
              <Icon size={22} />
            </div>
            <DialogHeader className="min-w-0 gap-2 pt-0.5">
              <span className="w-fit rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-text-secondary">
                {toneConfig.eyebrow}
              </span>
              <DialogTitle className="text-xl font-bold tracking-tight text-text-primary">{title}</DialogTitle>
              <DialogDescription className="max-w-[34rem] text-sm leading-6 text-text-secondary">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="mt-0 border-t border-border bg-background/70 px-5 py-4">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button className={cn('w-full shadow-sm sm:w-auto', toneConfig.buttonClass)} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Working...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
