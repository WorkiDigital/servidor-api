import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { listProjects, createProject, deleteProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { ConfirmModal } from '../components/ConfirmModal';
import { Skeleton } from '../components/Skeleton';
import type { Project } from '../types';

const DARK_CARD = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
};

export function ProjectsList() {
  const qc = useQueryClient();
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const createMut = useMutation({
    mutationFn: () => createProject(newName, newDomain || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setNewName('');
      setNewDomain('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
    },
  });

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-secondary)',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Projetos</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>Gerencie os clientes do TrackServer</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'var(--bg-surface)',
              boxShadow: '0 4px 14px var(--accent-border)',
            }}
          >
            <Plus size={15} />
            Novo Projeto
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(projects || []).map((p) => (
              <div
                key={p.id}
                className="rounded-2xl p-5 flex items-center gap-4 transition-all"
                style={DARK_CARD}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        p.status === 'active'
                          ? { backgroundColor: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                          : { backgroundColor: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(100,116,139,0.2)' }
                      }
                    >
                      {p.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                    {p.lastError && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Erro
                      </span>
                    )}
                  </div>
                  <div className="text-sm truncate" style={{ color: 'var(--text-faint)' }}>{p.domain}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    {p.totalEventsSent?.toLocaleString('pt-BR') || 0} eventos enviados
                    {p.pixelId && ` · Pixel ${p.pixelId.slice(0, 8)}...`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/hub/projects/${p.id}/dashboard`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
                    style={{
                      backgroundColor: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    <ExternalLink size={12} />
                    Abrir
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    <Trash2 size={12} />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              }}
            >
              <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Novo Projeto</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Nome do projeto <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="minha-loja"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Domínio do cliente
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="track.minhaloja.com.br"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createMut.mutate()}
                  disabled={!newName || createMut.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    color: 'var(--bg-surface)',
                  }}
                >
                  {createMut.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title={`Excluir projeto "${deleteTarget.name}"?`}
            description="Esta ação é irreversível. Todos os dados do projeto serão removidos."
            confirmWord="EXCLUIR"
            danger
            onConfirm={() => deleteMut.mutate(deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </Layout>
  );
}
