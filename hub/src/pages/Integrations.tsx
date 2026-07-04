import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProjectMeta } from '../api/projects';
import { Layout } from '../components/Layout';
import { FormField, Input, Select } from '../components/FormField';
import { TokenInput } from '../components/TokenInput';
import { CopyButton } from '../components/CopyButton';
import { Skeleton } from '../components/Skeleton';

const API_VERSIONS = ['v20.0', 'v21.0', 'v22.0'];

const DARK_CARD: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
};

export function Integrations() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const [pixelId, setPixelId] = useState('');
  const [apiVersion, setApiVersion] = useState('v22.0');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setPixelId(project.pixelId || '');
      setApiVersion(project.apiVersion || 'v22.0');
      setTestEventCode(project.testEventCode || '');
    }
  }, [project]);

  const saveMut = useMutation({
    mutationFn: () => updateProjectMeta(id!, {
      pixelId: pixelId || undefined,
      apiVersion,
      accessToken: accessToken || undefined,
      testEventCode: testEventCode || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['snippet', id] });
      setAccessToken('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout projectName={project?.name}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Integrações</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Conecte o workspace às plataformas externas: Meta Conversions API e plataformas de pagamento
          </p>
        </div>

        <div className="space-y-6">

          {/* Integração Meta */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Integração Meta</h2>
              {project?.hasToken && !project?.lastError && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                  Token válido
                </span>
              )}
              {project?.lastError && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  ⚠ {project.lastError}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Pixel ID / Dataset ID" required>
                <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="1234567890123456" />
              </FormField>

              <FormField label="Versão da API">
                <Select value={apiVersion} onChange={(e) => setApiVersion(e.target.value)}>
                  {API_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </Select>
              </FormField>

              <FormField label="Access Token (CAPI)" hint="Nunca exibido após salvo.">
                <TokenInput
                  hasToken={project?.hasToken ?? false}
                  tokenMasked={project?.tokenMasked}
                  value={accessToken}
                  onChange={setAccessToken}
                />
              </FormField>

              <FormField label="Test Event Code" hint="Opcional. Ex: TEST12345. Remova após validar — eventos de teste não otimizam campanhas.">
                <Input value={testEventCode} onChange={(e) => setTestEventCode(e.target.value)} placeholder="TEST12345" />
              </FormField>
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                  color: 'var(--bg-surface)',
                }}
              >
                {saveMut.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              {saved && <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>✓ Integração salva!</span>}
              {saveMut.isError && <span className="text-sm" style={{ color: 'var(--danger)' }}>Erro ao salvar. Tente novamente.</span>}
            </div>
          </div>

          {/* Plataformas */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <div className="mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Plataformas</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                Conecte suas plataformas de pagamento: cole a URL de webhook em cada uma para enviar eventos de compra ao Meta.
              </p>
            </div>
            {project && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Kiwify', platform: 'kiwify', color: '#a78bfa', initial: 'K' },
                    { label: 'Hotmart', platform: 'hotmart', color: '#fb923c', initial: 'H' },
                  ].map(({ label, platform, color, initial }) => {
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
      </div>
    </Layout>
  );
}
