import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProject } from '../api/projects';
import { Layout } from '../components/Layout';
import { CopyButton } from '../components/CopyButton';
import { Skeleton } from '../components/Skeleton';

const DARK_CARD: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
};

const PLATFORMS = [
  { label: 'Kiwify', platform: 'kiwify', color: '#a78bfa', initial: 'K' },
  { label: 'Hotmart', platform: 'hotmart', color: '#fb923c', initial: 'H' },
];

export function Platforms() {
  const { id } = useParams<{ id: string }>();

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
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Plataformas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Conecte suas plataformas de pagamento: cole a URL de webhook em cada uma para enviar eventos de compra ao Meta
          </p>
        </div>

        <div className="rounded-2xl p-6" style={DARK_CARD}>
          {project && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLATFORMS.map(({ label, platform, color, initial }) => {
                  const base = window.location.origin.replace(/-front\./, '-api.');
                  const url = `${base}/webhook/${platform}?source_id=${project.id}`;
                  return (
                    <div
                      key={platform}
                      className="flex flex-col gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Webhook de compras</div>
                        </div>
                      </div>
                      <code
                        className="text-xs font-mono break-all p-2.5 rounded-lg flex-1"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-muted)' }}
                      >
                        {url}
                      </code>
                      <CopyButton text={url} />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-dim)' }}>
                Para validação por assinatura, configure{' '}
                <code className="px-1 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>KIWIFY_WEBHOOK_SECRET</code>{' '}
                ou{' '}
                <code className="px-1 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>HOTMART_WEBHOOK_SECRET</code>{' '}
                nas variáveis de ambiente da API.
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
