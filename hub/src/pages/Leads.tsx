import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeads, exportLeadsCsv, deleteAllLeads } from '../api/leads';
import { getProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { ConfirmModal } from '../components/ConfirmModal';
import { Skeleton } from '../components/Skeleton';
import type { Lead, LeadStatus } from '../types';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Visitando', value: 'visiting' },
  { label: 'Identificados', value: 'identified' },
  { label: 'Convertidos', value: 'converted' },
];

const TEMP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  cold: { label: 'Frio', color: 'bg-blue-50 text-blue-600', icon: '❄️' },
  warm: { label: 'Morno', color: 'bg-amber-50 text-amber-600', icon: '🔥' },
  hot: { label: 'Quente', color: 'bg-red-50 text-red-600', icon: '🔴' },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  visiting: { label: 'Visitando', color: 'bg-gray-100 text-gray-600' },
  identified: { label: 'Identificado', color: 'bg-indigo-50 text-indigo-700' },
  converted: { label: 'Convertido', color: 'bg-teal-50 text-teal-700' },
};

function OriginChip({ value }: { value: string }) {
  const colors: Record<string, string> = {
    'Meta ADS': 'bg-blue-50 text-blue-700',
    Instagram: 'bg-pink-50 text-pink-700',
    Orgânico: 'bg-green-50 text-green-700',
    Direto: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Leads() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id!), enabled: !!id });
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', id, status, q, page],
    queryFn: () => getLeads(id!, { status, q, page }),
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAllLeads(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads', id] }); setShowDeleteModal(false); },
  });

  const totalPages = data ? Math.ceil(data.total / (data.limit || 15)) : 1;

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explorador de Leads</h1>
            <p className="text-sm text-gray-500">{data?.total?.toLocaleString('pt-BR') || 0} leads no total</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportLeadsCsv(id!)}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              ↓ Exportar CSV
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              🗑 Excluir Todos
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status tabs */}
            <div className="flex gap-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setStatus(tab.value); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    status === tab.value
                      ? 'bg-teal-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por e-mail, telefone, cidade..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Temp.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Entrada</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Disp.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Origem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Meta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Atividade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                  : (data?.items || []).map((lead: Lead) => {
                    const temp = TEMP_CONFIG[lead.temp] || TEMP_CONFIG.cold;
                    const st = STATUS_CONFIG[lead.status] || STATUS_CONFIG.visiting;
                    return (
                      <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-gray-400">{lead.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${temp.color}`}>
                            {temp.icon} {temp.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(lead.entrada)}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[120px] truncate">{lead.contato}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{lead.cidade}, {lead.estado}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{lead.dispositivo}</td>
                        <td className="px-4 py-3"><OriginChip value={lead.origem} /></td>
                        <td className="px-4 py-3">
                          {lead.meta ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">META</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(lead.ultimaAtividade)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Excluir todos os leads?"
          description="Esta ação é irreversível. Todos os dados de eventos e leads deste projeto serão apagados permanentemente."
          confirmWord="CONFIRMAR"
          danger
          onConfirm={() => deleteMut.mutate()}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </Layout>
  );
}
