import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getMetrics } from '../api/metrics';
import { getProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { KPIStat } from '../components/KPIStat';
import { ChartPanel } from '../components/ChartPanel';
import { KPISkeleton } from '../components/Skeleton';
import type { DatePreset } from '../types';

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

const DEVICE_COLORS = ['#2dd4bf', '#818cf8'];
const KPI_COLORS = ['#2dd4bf', '#818cf8', '#fb923c', '#a78bfa', '#f472b6', '#22d3ee'];

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1018',
  border: '1px solid #1a1f2e',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
};

const AXIS_TICK = { fontSize: 10, fill: '#475569' };

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const [preset, setPreset] = useState<DatePreset>('30d');
  const { from, to } = useMemo(() => presetToDates(preset), [preset]);

  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id!), enabled: !!id });
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', id, from, to],
    queryFn: () => getMetrics(id!, from, to),
    enabled: !!id,
  });

  const funnelData = metrics ? [
    { name: 'Visitantes', value: metrics.funnel.visitantes },
    { name: 'Engajados', value: metrics.funnel.engajados },
    { name: 'Identificados', value: metrics.funnel.identificados },
    { name: 'WhatsApp', value: metrics.funnel.whatsapp },
    { name: 'Convertidos', value: metrics.funnel.convertidos },
  ] : [];

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{project?.name}</p>
          </div>

          {/* Period selector */}
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

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
          ) : metrics ? (
            <>
              <KPIStat label="Visitantes" value={metrics.visitantes} color={KPI_COLORS[0]} sublabel="Sessões únicas" />
              <KPIStat label="Leads" value={metrics.leads} color={KPI_COLORS[1]} sublabel="Identificados" />
              <KPIStat label="Conversões" value={metrics.conversoes} color={KPI_COLORS[2]} sublabel="Purchases" />
              <KPIStat label="Faturamento" value={metrics.faturamento} color={KPI_COLORS[3]} format="currency" sublabel="Estimado" />
              <KPIStat label="Instagram" value={metrics.instagram} color={KPI_COLORS[4]} sublabel="Capturados" />
              <KPIStat label="Meta ADS" value={metrics.metaAds} color={KPI_COLORS[5]} sublabel="Tráfego pago" />
            </>
          ) : null}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ChartPanel title="Crescimento" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics?.growth || []} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gVisitantes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConversoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
                <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={AXIS_TICK} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Area type="monotone" dataKey="visitantes" name="Visitantes" stroke="#2dd4bf" fill="url(#gVisitantes)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pageviews" name="Pageviews" stroke="#818cf8" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="#fb923c" fill="url(#gConversoes)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Dispositivos">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metrics?.devices || []}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(metrics?.devices || []).map((_, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ChartPanel title="Funil de Vendas" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 11 }} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Usuários" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${168 - i * 12}, 70%, ${55 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Cidades">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.cities || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Visitas" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Origens">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.origins || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Sessões" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Charts row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ChartPanel title="Top Estados">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.states || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Visitas" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Países">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.countries || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Visitas" fill="#f472b6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Charts row 4 — UTMs Meta */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ChartPanel title="Top Campanhas">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.campaigns || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Sessões" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Medium">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.mediums || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Sessões" fill="#fb923c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Content">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.contents || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Sessões" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Term">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.terms || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1a1f2e" />
                <XAxis type="number" tick={AXIS_TICK} />
                <YAxis type="category" dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Sessões" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Summary */}
        {metrics && (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#0d1018', border: '1px solid #1a1f2e' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#64748b' }}>
              Resumo do Período
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Top Cidade', value: metrics.cities[0]?.label || '—' },
                { label: 'Top Estado', value: metrics.states[0]?.label || '—' },
                { label: 'Top Origem', value: metrics.origins[0]?.label || '—' },
                { label: 'Top Dispositivo', value: metrics.devices[0]?.label || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-xs block mb-1" style={{ color: '#334155' }}>{label}</span>
                  <div className="font-semibold text-sm" style={{ color: '#cbd5e1' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
