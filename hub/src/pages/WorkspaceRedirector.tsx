import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '../api/projects';
import { Activity } from 'lucide-react';

export function WorkspaceRedirector() {
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      navigate(`/hub/projects/${workspaces[0].id}/dashboard`, { replace: true });
    } else if (workspaces && workspaces.length === 0) {
      navigate(`/hub/projects/new`, { replace: true });
    }
  }, [workspaces, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            <Activity size={24} className="text-white" />
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Carregando workspaces...</div>
        </div>
      </div>
    );
  }

  return null;
}
