import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { getProject, updateProjectMeta, getFormCaptureRules, saveFormCaptureRules } from '../api/projects';
import type { FormCaptureRule } from '../api/projects';
import { getSnippet } from '../api/snippet';
import { Layout } from '../components/Layout';
import { FormField, Input } from '../components/FormField';
import { CodeBlock } from '../components/CodeBlock';
import { Skeleton } from '../components/Skeleton';

const DARK_CARD: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
};

export function Installation() {
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

  const [domain, setDomain] = useState('');
  const [domainType, setDomainType] = useState<'default' | 'custom'>('default');
  const [domainSaved, setDomainSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setDomain(project.customDomain || '');
      setDomainType(project.customDomain ? 'custom' : 'default');
    }
  }, [project]);

  const saveDomainMut = useMutation({
    mutationFn: () => updateProjectMeta(id!, {
      domain: domainType === 'default' ? '' : (domain || undefined),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['snippet', id] });
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 3000);
    },
  });

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Instalação</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Tudo que precisa ser configurado no site do cliente: domínio, script e captura de formulários
          </p>
        </div>

        <div className="space-y-6">

          {/* Domínio de Tracking */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Domínio de Tracking</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                  Tipo de domínio
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {[
                    { value: 'default', label: 'Usar domínio padrão TrackServer' },
                    { value: 'custom', label: 'Usar domínio próprio' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: 'var(--text-soft)' }}>
                      <input
                        type="radio"
                        name="domainType"
                        value={opt.value}
                        checked={domainType === opt.value}
                        onChange={() => setDomainType(opt.value as 'default' | 'custom')}
                        style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {domainType === 'default' ? (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--text-faint)' }}>
                    Domínio padrão
                  </label>
                  <div
                    className="text-sm font-mono inline-block px-3 py-2 rounded-lg select-all"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-soft)' }}
                  >
                    {project?.defaultDomain || 'carregando...'}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                    O projeto responderá automaticamente no domínio padrão. Nenhuma configuração de DNS adicional é necessária.
                  </p>
                </div>
              ) : (
                <FormField label="Domínio próprio do cliente" hint="Ex: track.nomedacliente.com.br. Aponte um CNAME para o alvo indicado abaixo.">
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="track.minhaloja.com.br" />
                </FormField>
              )}
            </div>

            <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => saveDomainMut.mutate()}
                disabled={saveDomainMut.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--bg-surface)' }}
              >
                {saveDomainMut.isPending ? 'Salvando...' : 'Salvar domínio'}
              </button>
              {domainSaved && <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>✓ Domínio salvo!</span>}
              {saveDomainMut.isError && <span className="text-sm" style={{ color: 'var(--danger)' }}>Erro ao salvar. Tente novamente.</span>}
            </div>
          </div>

          {/* Script de Instalação */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Script de Instalação</h2>
              {project?.firstEventAt && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
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

                <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    Cole este script no{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>&lt;head&gt;</code>{' '}
                    de todas as páginas do cliente.
                    O script inicializa o SDK first-party e envia eventos automaticamente para o Meta.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Configure o Pixel ID na página de Integrações para gerar o script.
              </p>
            )}
          </div>

          {/* Captura de Formulários */}
          <div className="rounded-2xl p-6" style={DARK_CARD}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Captura de Formulários</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  Define quais botões disparam eventos automaticamente. Separe múltiplos textos com vírgula.
                </p>
              </div>
              <button
                onClick={addRule}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                + Adicionar regra
              </button>
            </div>

            {rules.length === 0 ? (
              <div
                className="text-center py-10 text-sm rounded-xl"
                style={{ border: '1px dashed var(--border-input)', color: 'var(--text-dim)' }}
              >
                Nenhuma regra configurada. Clique em "Adicionar regra" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex-1">
                      <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-faint)' }}>
                        Texto do botão
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm px-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-600"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                        placeholder="quero meu desconto, cadastrar, enviar"
                        value={rule.buttonText.join(', ')}
                        onChange={(e) => updateRuleTexts(i, e.target.value)}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Separe múltiplos textos com vírgula</p>
                    </div>
                    <div className="sm:w-44">
                      <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-faint)' }}>
                        Evento
                      </label>
                      <select
                        className="w-full text-sm px-3 py-2 rounded-xl outline-none transition-all"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
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
                        style={{ color: 'var(--text-dim)' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)';
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

            <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => saveRulesMut.mutate()}
                disabled={saveRulesMut.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--bg-surface)' }}
              >
                {saveRulesMut.isPending ? 'Salvando...' : 'Salvar regras'}
              </button>
              {rulesSaved && <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>✓ Regras salvas!</span>}
              {saveRulesMut.isError && <span className="text-sm" style={{ color: 'var(--danger)' }}>Erro ao salvar.</span>}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
