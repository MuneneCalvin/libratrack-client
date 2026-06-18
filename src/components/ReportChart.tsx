import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const GOLD = '#C89B3C';
const NAVY = '#1E293B';
const SLATE = '#334155';

interface Props {
  type: 'bar' | 'line' | 'pie';
  data: { name: string; value: number }[];
  height?: number;
}

export default function ReportChart({ type, data, height = 280 }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border bg-background text-sm text-text-secondary"
        style={{ minHeight: height }}
      >
        No report data yet
      </div>
    );
  }

  if (type === 'pie') {
    const COLORS = [GOLD, NAVY, SLATE, '#10B981', '#F59E0B'];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={88}
            labelLine={false}
            label={({ value }) => String(value)}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={8} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={8} interval={0} height={46} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
