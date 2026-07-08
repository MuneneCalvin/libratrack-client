import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageBackButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function PageBackButton({ label, onClick, className }: PageBackButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'mb-3 gap-2 rounded-full border-primary/10 bg-surface px-3 text-text-primary shadow-sm hover:border-accent/40 hover:bg-accent/10 hover:text-primary',
        className,
      )}
    >
      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover/button:-translate-x-0.5">
        <ArrowLeft size={12} />
      </span>
      {label}
    </Button>
  );
}
