import { useState } from 'react';
import { reportsService } from '@/services/reports.service';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

interface Props { report: string; label?: string; }

export default function ExportButton({ report, label = 'Export CSV' }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await reportsService.export('csv', report);
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full gap-2 sm:w-auto')}
      onClick={handleExport}
      disabled={loading}
    >
      <Download size={15} /> {loading ? 'Exporting...' : label}
    </button>
  );
}
