import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Copy, Check } from 'lucide-react';
import { getProject, updateProjectMeta, getFormCaptureRules, saveFormCaptureRules } from '../api/projects';
import type { FormCaptureRule } from '../api/projects';
import { getSnippet } from '../api/snippet';
import { Layout } from '../components/Layout';
import { FormField, Input, Select } from '../components/FormField';
import { TokenInput } from '../components/TokenInput';
import { CodeBlock } from '../components/CodeBlock';
import { Skeleton } from '../components/Skeleton';

const API_VERSIONS = ['v20.0', 'v21.0', 'v22.0'];

const DARK_CARD: React.CSSProperties = {
  backgroundColor: '#0d1018',
  border: '1px solid #1a1f2e',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={
        copied
          ? { backgroundColor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
          : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid #1a1f2e' }
      }
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export function ProjectConfig() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const { data: snippetData, isLoading: snippetLoading } = useQuery({
    queryKey: ['snippet', id],
    queryFn: () => getSnippet(id!),
    enabled: !!id,
  });

  const [pixelId, setPixelId] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [apiVersion, setApiVersion] = useState('v22.0');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [domain, setDomain] = useState('');
  const [domainType, setDomainType] = useState<'default' | 'custom'>('default');
  const [saved, setSaved] = useState(false);

  const { data: formRules = [] } = useQuery({
    queryKey: ['form-capture', id],
    queryFn: () => getFormCaptureRules(id!),
    enabled: !!id,
  });

  const [rules, setRules] = useState<FormCaptureRule[]>([]);
  const [rulesSaved, setRulesSaved] = useState(false);

  useEffect(() => { setRules(formRules); }, [formRules]);

  const saveRulesMut = useMutation({
    mutationFn: () => saveFormCaptureRules(id!, rules),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form-capture', id] });
      qc.invalidateQueries({ queryKey: ['snippet', id] });
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 3000);
    },
  });

  function addRule() {
    setRules((prev) => [...prev, { buttonText: [''], eventName: 'Lead', customData: {} }]);
  }

  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateRuleEvent(i: number, val: string) {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, eventName: val } : r));
  }

  function updateRuleTexts(i: number, val: string) {
    const texts = val.split(',').map((s) => s.trim()).filter(Boolean);
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, buttonText: texts.length ? texts : [''] } : r));
  }

  useEffect(() => {
    if (project) {
      setPixelId(project.pixelId || '');
      setDatasetId(project.datasetId || project.pixelId || '');
      setApiVersion(project.apiVersion || 'v22.0');
      setTestEventCode(project.testEventCode || '');
      setDomain(project.customDomain || '');
      setDomainType(project.customDomain ? 'custom' : 'default');
    }
  }, [project]);

  const saveMut = useMutation({
    mutationFn: () => updateProjectMeta(id!, {
      pixelId: pixelId || undefined,
      datasetId: datasetId || undefined,
      apiVersion,
      accessToken: accessToken || undefined,
      testEventCode: testEventCode || undefined,
      domain: domainType === 'default' ? '' : (domain || undefined),
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
          <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Configuração Meta</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>Configure a integração com Meta Pixel e Conversions API</p>
        </div>

        {/* Bloco A — Integração Meta */}
        <div className="rounded-2xl p-6 mb-5" style={DARK_CARD}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Integração Meta</h2>
            {project?.hasToken && !project?.lastError && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#2dd4bf' }} />
                Token válido
              </span>
            )}
            {project?.lastError && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
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

            <FormField label="Test Event Code" hint="Opcional. Ex: TEST12345">
              <Input value={testEventCode} onChange={(e) => setTestEventCode(e.target.value)} placeholder="TEST12345" />
            </FormField>

            {/* Domínio de Tracking */}
            <div className="col-span-1 sm:col-span-2 pt-4 mt-2" style={{ borderTop: '1px solid #1a1f2e' }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} style={{ color: '#2dd4bf' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Domínio de Tracking</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: '#64748b' }}>
                    Tipo de domínio
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    {[
                      { value: 'default', label: 'Usar domínio padrão TrackServer' },
                      { value: 'custom', label: 'Usar domínio próprio' },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#94a3b8' }}>
                        <input
                          type="radio"
                          name="domainType"
                          value={opt.value}
                          checked={domainType === opt.value}
                          onChange={() => setDomainType(opt.value as 'default' | 'custom')}
                          style={{ accentColor: '#2dd4bf', width: 16, height: 16 }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {domainType === 'default' ? (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#080a10', border: '1px solid #1a1f2e' }}>
                    <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: '#475569' }}>
                      Domínio padrão
                    </label>
                    <div
                      className="text-sm font-mono inline-block px-3 py-2 rounded-lg select-all"
                      style={{ backgroundColor: '#0d1018', border: '1px solid #1e2438', color: '#94a3b8' }}
                    >
                      {project?.defaultDomain || 'carregando...'}
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#334155' }}>
                      O projeto responderá automaticamente no domínio padrão. Nenhuma configuração de DNS adicional é necessária.
                    </p>
                  </div>
                ) : (
                  <FormField label="Domínio próprio do cliente" hint="Ex: track.nomedacliente.com.br. Aponte um CNAME para o alvo indicado abaixo.">
                    <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="track.minhaloja.com.br" />
                  </FormField>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid #1a1f2e' }}>
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
                color: '#0d1018',
              }}
            >
              {saveMut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            {saved && <span className="text-sm font-medium" style={{ color: '#2dd4bf' }}>✓ Configurações salvas!</span>}
            {saveMut.isError && <span className="text-sm" style={{ color: '#f87171' }}>Erro ao salvar. Tente novamente.</span>}
          </div>
        </div>

        {/* Bloco B — Captura de Formulários */}
        <div className="rounded-2xl p-6 mb-5" style={DARK_CARD}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Captura de Formulários</h2>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                Define quais botões disparam eventos automaticamente. Separe múltiplos textos com vírgula.
              </p>
            </div>
            <button
              onClick={addRule}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all"
              style={{
                backgroundColor: 'rgba(45,212,191,0.08)',
                color: '#2dd4bf',
                border: '1px solid rgba(45,212,191,0.2)',
              }}
            >
              + Adicionar regra
            </button>
          </div>

          {rules.length === 0 ? (
            <div
              className="text-center py-10 text-sm rounded-xl"
              style={{ border: '1px dashed #1e2438', color: '#334155' }}
            >
              Nenhuma regra configurada. Clique em "Adicionar regra" para começar.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: '#080a10', border: '1px solid #1a1f2e' }}
                >
                  <div className="flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#475569' }}>
                      Texto do botão
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm px-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-600"
                      style={{ backgroundColor: '#0d1018', border: '1px solid #1e2438', color: '#e2e8f0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2dd4bf'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2438'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder="quero meu desconto, cadastrar, enviar"
                      value={rule.buttonText.join(', ')}
                      onChange={(e) => updateRuleTexts(i, e.target.value)}
                    />
                    <p className="text-xs mt-1" style={{ color: '#334155' }}>Separe múltiplos textos com vírgula</p>
                  </div>
                  <div className="sm:w-44">
                    <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#475569' }}>
                      Evento
                    </label>
                    <select
                      className="w-full text-sm px-3 py-2 rounded-xl outline-none transition-all"
                      style={{ backgroundColor: '#0d1018', border: '1px solid #1e2438', color: '#e2e8f0' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2dd4bf'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2438'; e.currentTarget.style.boxShadow = 'none'; }}
                      value={rule.eventName}
                      onChange={(e) => updateRuleEvent(i, e.target.value)}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Contact">Contact</option>
                      <option value="CompleteRegistration">CompleteRegistration</option>
                      <option value="Schedule">Schedule</option>
                      <option value="Purchase">Purchase</option>
                      <option value="SubmitApplication">SubmitApplication</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeRule(i)}
                      className="p-2 rounded-xl transition-all"
                      style={{ color: '#334155' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#f87171';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#334155';
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #1a1f2e' }}>
            <button
              onClick={() => saveRulesMut.mutate()}
              disabled={saveRulesMut.isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', color: '#0d1018' }}
            >
              {saveRulesMut.isPending ? 'Salvando...' : 'Salvar regras'}
            </button>
            {rulesSaved && <span className="text-sm font-medium" style={{ color: '#2dd4bf' }}>✓ Regras salvas!</span>}
            {saveRulesMut.isError && <span className="text-sm" style={{ color: '#f87171' }}>Erro ao salvar.</span>}
          </div>
        </div>

        {/* Bloco C — Webhooks */}
        <div className="rounded-2xl p-6 mb-5" style={DARK_CARD}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>URLs de Webhook</h2>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
              Cole estas URLs nas plataformas de pagamento para enviar eventos de compra ao Meta.
            </p>
          </div>
          {project && (
            <div className="space-y-3">
              {[
                { label: 'Kiwify', platform: 'kiwify', color: '#a78bfa' },
                { label: 'Hotmart', platform: 'hotmart', color: '#fb923c' },
              ].map(({ label, platform, color }) => {
                const base = window.location.origin.replace(/-front\./, '-api.');
                const url = `${base}/webhook/${platform}?source_id=${project.id}`;
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: '#080a10', border: '1px solid #1a1f2e' }}
                  >
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-lg w-16 text-center shrink-0"
                      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
                    >
                      {label}
                    </span>
                    <code className="flex-1 text-xs font-mono break-all" style={{ color: '#64748b' }}>{url}</code>
                    <CopyButton text={url} />
                  </div>
                );
              })}
              <p className="text-xs" style={{ color: '#334155' }}>
                Para validação por assinatura, configure{' '}
                <code className="px-1 rounded" style={{ backgroundColor: '#1a1f2e', color: '#64748b' }}>KIWIFY_WEBHOOK_SECRET</code>{' '}
                ou{' '}
                <code className="px-1 rounded" style={{ backgroundColor: '#1a1f2e', color: '#64748b' }}>HOTMART_WEBHOOK_SECRET</code>{' '}
                nas variáveis de ambiente da API.
              </p>
            </div>
          )}
        </div>

        {/* Bloco D — Script */}
        <div className="rounded-2xl p-6" style={DARK_CARD}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Script de Instalação</h2>
            {project?.firstEventAt && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                ✓ Pixel detectado
              </span>
            )}
          </div>

          {snippetLoading ? (
            <Skeleton className="h-40" />
          ) : snippetData ? (
            <>
              <CodeBlock code={snippetData.script} />

              <div
                className="mt-4 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: '#fbbf24' }}>Instrução de CNAME</p>
                <p className="text-xs mb-2" style={{ color: '#92400e' }}>
                  Aponte um registro CNAME do seu domínio para{' '}
                  <code
                    className="px-1 py-0.5 rounded font-mono"
                    style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}
                  >
                    {snippetData.cnameTarget}
                  </code>
                </p>
                <div
                  className="font-mono text-xs px-3 py-2 rounded"
                  style={{ backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}
                >
                  {snippetData.clientCname} → {snippetData.cnameTarget}
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: '#080a10', border: '1px solid #1a1f2e' }}>
                <p className="text-xs" style={{ color: '#475569' }}>
                  Cole este script no{' '}
                  <code className="px-1 rounded" style={{ backgroundColor: '#1a1f2e', color: '#64748b' }}>&lt;head&gt;</code>{' '}
                  de todas as páginas do cliente.
                  O script inicializa o SDK first-party e envia eventos automaticamente para o Meta.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: '#334155' }}>Configure o Pixel ID acima para gerar o script.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
