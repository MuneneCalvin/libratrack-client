import { useState } from 'react';
import { reportsService } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface Props { report: string; }

export default function ExportButton({ report }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport(type: 'csv' | 'pdf') {
    setLoading(true);
    try {
      const res = await reportsService.export(type, report);
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report}-${new Date().toISOString().slice(0, 10)}.${type}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
          <Download size={15} /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>Export CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>Export PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
