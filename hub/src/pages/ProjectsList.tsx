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
  backgroundColor: '#0d1018',
  border: '1px solid #1a1f2e',
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
    backgroundColor: '#0a0d14',
    border: '1px solid #1e2438',
    color: '#e2e8f0',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Projetos</h1>
            <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Gerencie os clientes do TrackServer</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
              color: '#0d1018',
              boxShadow: '0 4px 14px rgba(45,212,191,0.2)',
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
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#252c40'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1f2e'; }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: '#e2e8f0' }}>{p.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        p.status === 'active'
                          ? { backgroundColor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
                          : { backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }
                      }
                    >
                      {p.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                    {p.lastError && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Erro
                      </span>
                    )}
                  </div>
                  <div className="text-sm truncate" style={{ color: '#475569' }}>{p.domain}</div>
                  <div className="text-xs mt-1" style={{ color: '#334155' }}>
                    {p.totalEventsSent?.toLocaleString('pt-BR') || 0} eventos enviados
                    {p.pixelId && ` · Pixel ${p.pixelId.slice(0, 8)}...`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/hub/projects/${p.id}/dashboard`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
                    style={{
                      backgroundColor: 'rgba(45,212,191,0.08)',
                      color: '#2dd4bf',
                      border: '1px solid rgba(45,212,191,0.2)',
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
                      color: '#f87171',
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
                backgroundColor: '#0d1018',
                border: '1px solid #1a1f2e',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              }}
            >
              <h2 className="text-base font-bold mb-5" style={{ color: '#f1f5f9' }}>Novo Projeto</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>
                    Nome do projeto <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2dd4bf'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2438'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="minha-loja"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>
                    Domínio do cliente
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2dd4bf'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2438'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="track.minhaloja.com.br"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ color: '#64748b', border: '1px solid #1a1f2e' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createMut.mutate()}
                  disabled={!newName || createMut.isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
                    color: '#0d1018',
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
