import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { getProject, deleteProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { Skeleton } from '../components/Skeleton';

const DARK_CARD: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
};

export function ProjectConfig() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configurações do Workspace</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Administração do workspace. Integrações e instalação no site têm páginas próprias no menu lateral.
          </p>
        </div>

        <div className="space-y-6">

          {/* Informações do Workspace */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Informações</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Nome</div>
                <div style={{ color: 'var(--text-soft)' }}>{project?.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>ID do workspace</div>
                <div className="font-mono text-xs select-all" style={{ color: 'var(--text-muted)' }}>{project?.id || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Criado em</div>
                <div style={{ color: 'var(--text-soft)' }}>
                  {project?.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>Status</div>
                <div style={{ color: project?.status === 'active' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {project?.status === 'active' ? 'Ativo' : 'Pausado'}
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl p-6" style={{ ...DARK_CARD, border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Trash2 size={16} className="text-red-500" />
              <h2 className="text-sm font-semibold text-red-500">Zona de Perigo</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
              A exclusão do workspace é uma ação irreversível. Todos os dados associados a este workspace serão apagados permanentemente.
            </p>
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir o workspace "${project?.name}"? Esta ação é irreversível.`)) {
                  deleteProject(id!).then(() => {
                    qc.invalidateQueries({ queryKey: ['projects'] });
                    window.location.href = '/hub';
                  });
                }
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger)';
                (e.currentTarget as HTMLElement).style.color = 'var(--bg-surface)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.1)';
                (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
              }}
            >
              Excluir workspace
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
