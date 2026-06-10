import { useState } from 'react';
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

const DEVICE_COLORS = ['#10b981', '#6366f1'];
const KPI_COLORS = ['#10b981', '#6366f1', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const [preset, setPreset] = useState<DatePreset>('30d');
  const { from, to } = presetToDates(preset);

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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">{project?.name}</p>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreset(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  preset === opt.value
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConversoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} width={35} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="visitantes" name="Visitantes" stroke="#10b981" fill="url(#gVisitantes)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pageviews" name="Pageviews" stroke="#6366f1" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="#f97316" fill="url(#gConversoes)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Dispositivos">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metrics?.devices || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {(metrics?.devices || []).map((_, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ChartPanel title="Funil de Vendas" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" name="Usuários" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${160 - i * 15}, 70%, ${50 + i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Top Cidades">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.cities || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Visitas" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Origens">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.origins || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Sessões" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>

        {/* Summary */}
        {metrics && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo do Período</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Top Cidade</span><div className="font-semibold">{metrics.cities[0]?.label || '—'}</div></div>
              <div><span className="text-gray-500">Top Estado</span><div className="font-semibold">{metrics.states[0]?.label || '—'}</div></div>
              <div><span className="text-gray-500">Top Origem</span><div className="font-semibold">{metrics.origins[0]?.label || '—'}</div></div>
              <div><span className="text-gray-500">Top Dispositivo</span><div className="font-semibold">{metrics.devices[0]?.label || '—'}</div></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
