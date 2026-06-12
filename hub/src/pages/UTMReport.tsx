import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, Target, DollarSign, MousePointerClick } from 'lucide-react';
import { getUtmReport } from '../api/utm';
import { getProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { ChartPanel } from '../components/ChartPanel';
import { KPISkeleton } from '../components/Skeleton';
import type { DatePreset, UtmTimelinePoint } from '../types';

const PRESET_OPTIONS: { label: string; value: DatePreset }[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: '7 dias', value: '7d' },
  { label: '15 dias', value: '15d' },
  { label: '30 dias', value: '30d' },
];

function presetToDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = now.toISOString();
  const presetMap: Record<DatePreset, Date> = {
    today: today,
    yesterday: new Date(today.getTime() - 86400000),
    '7d': new Date(today.getTime() - 7 * 86400000),
    '15d': new Date(today.getTime() - 15 * 86400000),
    '30d': new Date(today.getTime() - 30 * 86400000),
    custom: new Date(today.getTime() - 30 * 86400000),
  };
  return { from: presetMap[preset].toISOString(), to };
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1018',
  border: '1px solid #1a1f2e',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
};
const AXIS_TICK = { fontSize: 10, fill: '#475569' };
const SOURCE_COLORS = ['#2dd4bf', '#818cf8', '#fb923c', '#f472b6', '#22d3ee', '#a78bfa'];

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

// Pivot timeline rows into recharts-friendly format: [{date, camp1, camp2, ...}]
function pivotTimeline(rows: UtmTimelinePoint[]): { date: string; [key: string]: string | number }[] {
  const map = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const d = String(r.date).slice(0, 10);
    if (!map.has(d)) map.set(d, {});
    map.get(d)![r.campaign] = (map.get(d)![r.campaign] || 0) + r.sessoes;
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
}

export function UTMReport() {
  const { id } = useParams<{ id: string }>();
  const [preset, setPreset] = useState<DatePreset>('30d');
  const { from, to } = useMemo(() => presetToDates(preset), [preset]);
  const [sortCol, setSortCol] = useState<'sessoes' | 'leads' | 'conversoes' | 'faturamento' | 'taxaConversao'>('sessoes');

  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id!), enabled: !!id });
  const { data: report, isLoading } = useQuery({
    queryKey: ['utm-report', id, from, to],
    queryFn: () => getUtmReport(id!, from, to),
    enabled: !!id,
  });

  const sortedTable = useMemo(() => {
    if (!report) return [];
    return [...report.campaignTable].sort((a, b) => b[sortCol] - a[sortCol]);
  }, [report, sortCol]);

  const campaigns = useMemo(() => {
    if (!report) return [];
    return [...new Set(report.timeline.map((r) => r.campaign))].slice(0, 5);
  }, [report]);

  const timelineData = useMemo(() => pivotTimeline(report?.timeline || []), [report]);

  const ColHeader = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <th
      className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
      style={{ color: sortCol === col ? '#2dd4bf' : '#475569' }}
      onClick={() => setSortCol(col)}
    >
      {label} {sortCol === col ? '↓' : ''}
    </th>
  );

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Relatório UTM</h1>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Análise completa de campanhas e origens de tráfego</p>
          </div>
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ backgroundColor: '#0d1018', border: '1px solid #1a1f2e' }}
          >
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreset(opt.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  preset === opt.value
                    ? { backgroundColor: '#2dd4bf', color: '#0d1018' }
                    : { color: '#475569' }
                }
                onMouseEnter={(e) => {
                  if (preset !== opt.value) {
                    (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (preset !== opt.value) {
                    (e.currentTarget as HTMLElement).style.color = '#475569';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs resumidos */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)}
          </div>
        ) : report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              {
                label: 'Campanhas ativas',
                value: report.campaignTable.filter(r => r.campaign !== '(sem campanha)').length,
                icon: <Target size={16} />,
                color: '#2dd4bf',
                format: 'number',
              },
              {
                label: 'Sessões pagas',
                value: report.sourceFunnel.filter(r => r.source !== 'direto').reduce((s, r) => s + r.sessoes, 0),
                icon: <MousePointerClick size={16} />,
                color: '#818cf8',
                format: 'number',
              },
              {
                label: 'Conversões pagas',
                value: report.sourceFunnel.filter(r => r.source !== 'direto').reduce((s, r) => s + r.conversoes, 0),
                icon: <TrendingUp size={16} />,
                color: '#fb923c',
                format: 'number',
              },
              {
                label: 'Faturamento atribuído',
                value: report.topCombos.reduce((s, r) => s + r.faturamento, 0),
                icon: <DollarSign size={16} />,
                color: '#a78bfa',
                format: 'currency',
              },
            ].map(({ label, value, icon, color, format }) => (
              <div
                key={label}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#0d1018', border: '1px solid #1a1f2e' }}
              >
                <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
                    <span style={{ color }}>{icon}</span>
                    {label}
                  </div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>
                    {format === 'currency' ? formatBRL(value as number) : Number(value).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabela de campanhas */}
        <div
          className="rounded-2xl mb-4 overflow-hidden"
          style={{ backgroundColor: '#0d1018', border: '1px solid #1a1f2e' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a1f2e' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#94a3b8' }}>
              Campanhas — clique no cabeçalho para ordenar
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#080a10' }}>
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Campanha</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Source</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Medium</th>
                  <ColHeader col="sessoes" label="Sessões" />
                  <ColHeader col="leads" label="Leads" />
                  <ColHeader col="conversoes" label="Conversões" />
                  <ColHeader col="faturamento" label="Faturamento" />
                  <ColHeader col="taxaConversao" label="Taxa conv." />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #1a1f2e' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 rounded" style={{ backgroundColor: '#1a1f2e', width: j === 0 ? '120px' : '60px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sortedTable.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: '#475569' }}>
                      Nenhum dado UTM no período selecionado
                    </td>
                  </tr>
                ) : sortedTable.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderTop: '1px solid #1a1f2e' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <td className="px-3 py-3 font-medium max-w-[180px] truncate" style={{ color: '#e2e8f0' }} title={row.campaign}>
                      {row.campaign}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.15)' }}
                      >
                        {row.source}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: '#64748b' }}>{row.medium}</td>
                    <td className="px-3 py-3 text-right tabular-nums" style={{ color: '#94a3b8' }}>
                      {row.sessoes.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums" style={{ color: '#818cf8' }}>
                      {row.leads.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums" style={{ color: '#fb923c' }}>
                      {row.conversoes.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: '#2dd4bf' }}>
                      {formatBRL(row.faturamento)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={
                          row.taxaConversao >= 3
                            ? { backgroundColor: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }
                            : row.taxaConversao >= 1
                            ? { backgroundColor: 'rgba(251,146,60,0.1)', color: '#fb923c' }
                            : { backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b' }
                        }
                      >
                        {row.taxaConversao.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funil por source + Top combos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ChartPanel title="Funil por Origem (Source)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report?.sourceFunnel || []} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                <XAxis dataKey="source" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Bar dataKey="sessoes" name="Sessões" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversoes" name="Conversões" fill="#fb923c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Combinações Lucrativas (Source + Campanha)">
            <div className="space-y-2 mt-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl" style={{ backgroundColor: '#1a1f2e' }} />
                ))
              ) : (report?.topCombos || []).length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#475569' }}>Sem conversões no período</p>
              ) : (report?.topCombos || []).map((combo, i) => {
                const maxFat = report!.topCombos[0].faturamento || 1;
                const pct = Math.max(4, (combo.faturamento / maxFat) * 100);
                return (
                  <div key={i} className="rounded-xl p-3 relative overflow-hidden" style={{ backgroundColor: '#080a10', border: '1px solid #1a1f2e' }}>
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-l-xl"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgba(45,212,191,0.12), transparent)` }}
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold truncate block" style={{ color: '#e2e8f0' }}>
                          {combo.campaign}
                        </span>
                        <span className="text-xs" style={{ color: '#475569' }}>{combo.source}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold tabular-nums" style={{ color: '#2dd4bf' }}>
                          {formatBRL(combo.faturamento)}
                        </div>
                        <div className="text-xs" style={{ color: '#64748b' }}>
                          {combo.conversoes} conversão{combo.conversoes !== 1 ? 'ões' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartPanel>
        </div>

        {/* Linha do tempo por campanha */}
        <ChartPanel title="Evolução de Sessões — Top 5 Campanhas">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
              <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v) => String(v).slice(5)} />
              <YAxis tick={AXIS_TICK} width={35} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {campaigns.map((camp, i) => (
                <Line
                  key={camp}
                  type="monotone"
                  dataKey={camp}
                  name={camp}
                  stroke={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

      </div>
    </Layout>
  );
}
