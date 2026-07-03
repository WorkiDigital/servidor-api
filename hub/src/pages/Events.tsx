import { Fragment, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Code2 } from 'lucide-react';
import { getEventsLog } from '../api/events';
import { getProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { Skeleton } from '../components/Skeleton';
import type { EventLogItem } from '../types';

const EVENT_OPTIONS = ['Lead', 'InitiateCheckout', 'Purchase'];

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Todos os status', value: '' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Falhou', value: 'error' },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function StatusBadge({ sent }: { sent: boolean }) {
  return sent ? (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: 'rgba(45,212,191,0.1)', color: 'var(--accent)' }}
    >
      <CheckCircle2 size={12} /> Enviado
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}
    >
      <XCircle size={12} /> Falhou
    </span>
  );
}

function PayloadPanel({ item }: { item: EventLogItem }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--row-border)' }}>
      <td colSpan={6} className="px-4 py-4" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              <Code2 size={12} /> Payload enviado
            </div>
            <pre
              className="text-xs p-3 rounded-xl overflow-x-auto max-h-80 overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {JSON.stringify(item.requestPayload, null, 2)}
            </pre>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
              <Code2 size={12} /> Resposta da Meta
            </div>
            <pre
              className="text-xs p-3 rounded-xl overflow-x-auto max-h-80 overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {item.metaResponse ? JSON.stringify(item.metaResponse, null, 2) : '— sem resposta registrada —'}
            </pre>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function Events() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id!), enabled: !!id });

  const [eventName, setEventName] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events-log', id, eventName, status, from, to, page],
    queryFn: () => getEventsLog(id!, { event: eventName || undefined, status: status || undefined, from: from || undefined, to: to || undefined, page }),
    enabled: !!id,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.limit || 25))) : 1;

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-secondary)',
  };

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Log de Envios</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Auditoria do que foi enviado à Meta Conversions API — exclui PageView e ViewContent (alto volume, ficam agregados só no dashboard).
          </p>
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Evento</label>
            <select
              value={eventName}
              onChange={(e) => { setEventName(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 rounded-xl text-sm outline-none"
              style={selectStyle}
            >
              <option value="">Todos os eventos</option>
              {EVENT_OPTIONS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 rounded-xl text-sm outline-none"
              style={selectStyle}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>De</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 rounded-xl text-sm outline-none"
              style={selectStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>Até</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 rounded-xl text-sm outline-none"
              style={selectStyle}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }}>
                  {['', 'Hora', 'Evento', 'Event ID', 'External ID', 'Status'].map((h) => (
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
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                  : (data?.items || []).map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <Fragment key={item.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="cursor-pointer"
                          style={{ borderBottom: '1px solid var(--row-border)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--row-hover)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        >
                          <td className="px-4 py-3">
                            <ChevronDown
                              size={14}
                              style={{ color: 'var(--text-faint)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                            {item.eventName}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
                            {item.eventId}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.externalId || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge sent={item.sentToMeta} />
                          </td>
                        </tr>
                        {isExpanded && <PayloadPanel item={item} />}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {!isLoading && (data?.items.length || 0) === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
              Nenhum evento encontrado para os filtros selecionados.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl transition-all disabled:opacity-30"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <ChevronLeft size={13} /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl transition-all disabled:opacity-30"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Próxima <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
