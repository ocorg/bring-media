'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTranslations } from 'next-intl';

interface MemberData {
  name: string;
  urgent: number;
  high: number;
  normal: number;
  low: number;
}

interface Props {
  data: MemberData[];
}

const COLORS = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#8f00ff',
  low: '#6b7280',
};

export default function WorkloadChart({ data }: Props) {
  const t = useTranslations('tasks.priority');
  if (data.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem' }}>
        No task data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#e2e8f0', marginBottom: '4px' }}
        />
        <Bar dataKey="urgent" stackId="a" fill={COLORS.urgent} name={t('urgent')} radius={[0, 0, 0, 0]} />
        <Bar dataKey="high" stackId="a" fill={COLORS.high} name={t('high')} />
        <Bar dataKey="normal" stackId="a" fill={COLORS.normal} name={t('normal')} />
        <Bar dataKey="low" stackId="a" fill={COLORS.low} name={t('low')} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}