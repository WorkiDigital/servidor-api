import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

const TEMP_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  cold: { label: 'Frio', bgColor: 'rgba(59,130,246,0.1)', textColor: '#60a5fa', icon: '❄️' },
  warm: { label: 'Morno', bgColor: 'rgba(245,158,11,0.1)', textColor: '#fbbf24', icon: '🔥' },
  hot: { label: 'Quente', bgColor: 'rgba(239,68,68,0.1)', textColor: 'var(--danger)', icon: '🔴' },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; bgColor: string; textColor: string }> = {
  visiting: { label: 'Visitando', bgColor: 'rgba(100,116,139,0.1)', textColor: 'var(--text-muted)' },
  identified: { label: 'Identificado', bgColor: 'rgba(129,140,248,0.1)', textColor: '#818cf8' },
  converted: { label: 'Convertido', bgColor: 'rgba(45,212,191,0.1)', textColor: 'var(--accent)' },
};

const ORIGIN_COLORS: Record<string, { bg: string; text: string }> = {
  'Meta ADS': { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
  Instagram: { bg: 'rgba(244,114,182,0.1)', text: '#f472b6' },
  Orgânico: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80' },
  Direto: { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8' },
};

function OriginChip({ value }: { value: string }) {
  const c = ORIGIN_COLORS[value] || { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8' };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads', id] });
      setShowDeleteModal(false);
    },
  });

  const totalPages = data ? Math.ceil(data.total / (data.limit || 15)) : 1;

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Explorador de Leads</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {data?.total?.toLocaleString('pt-BR') || 0} leads no total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportLeadsCsv(id!)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-soft)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-soft)';
              }}
            >
              <Download size={14} />
              Exportar CSV
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--danger)',
              }}
            >
              <Trash2 size={14} />
              Excluir Todos
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setStatus(tab.value); setPage(1); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    status === tab.value
                      ? { backgroundColor: 'var(--accent)', color: 'var(--bg-surface)' }
                      : { color: 'var(--text-faint)' }
                  }
                  onMouseEnter={(e) => {
                    if (status !== tab.value) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-soft)';
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (status !== tab.value) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por e-mail, telefone, cidade..."
              className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
              style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
                  {['Lead', 'Temp.', 'Entrada', 'Contato', 'Cidade', 'Disp.', 'Origem', 'Meta', 'Atividade', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--row-border)' }}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                  : (data?.items || []).map((lead: Lead) => {
                    const temp = TEMP_CONFIG[lead.temp] || TEMP_CONFIG.cold;
                    const st = STATUS_CONFIG[lead.status] || STATUS_CONFIG.visiting;
                    return (
                      <tr
                        key={lead.id}
                        style={{ borderBottom: '1px solid var(--row-border)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--row-hover)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>{lead.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: temp.bgColor, color: temp.textColor }}
                          >
                            {temp.icon} {temp.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                          {formatDate(lead.entrada)}
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[120px] truncate" style={{ color: 'var(--text-soft)' }}>
                          {lead.contato}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.cidade}, {lead.estado}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>{lead.dispositivo}</td>
                        <td className="px-4 py-3"><OriginChip value={lead.origem} /></td>
                        <td className="px-4 py-3">
                          {lead.meta ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-bold"
                              style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                            >
                              META
                            </span>
                          ) : (
                            <span style={{ color: 'var(--border-input)' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                          {formatDate(lead.ultimaAtividade)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: st.bgColor, color: st.textColor }}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl transition-all disabled:opacity-30"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { if (page > 1) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl transition-all disabled:opacity-30"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { if (page < totalPages) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  Próxima <ChevronRight size={13} />
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
