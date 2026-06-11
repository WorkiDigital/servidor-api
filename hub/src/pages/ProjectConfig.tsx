import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProjectMeta, getFormCaptureRules, saveFormCaptureRules } from '../api/projects';
import type { FormCaptureRule } from '../api/projects';
import { getSnippet } from '../api/snippet';
import { Layout } from '../components/Layout';
import { FormField, Input, Select } from '../components/FormField';
import { TokenInput } from '../components/TokenInput';
import { CodeBlock } from '../components/CodeBlock';
import { Skeleton } from '../components/Skeleton';

const API_VERSIONS = ['v20.0', 'v21.0', 'v22.0'];

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
          <h1 className="text-2xl font-bold text-gray-900">Configuração Meta</h1>
          <p className="text-sm text-gray-500">Configure a integração com Meta Pixel e Conversions API</p>
        </div>

        {/* Bloco A — Formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-semibold text-gray-800">Integração Meta</h2>
            {project?.hasToken && !project?.lastError && (
              <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                Token válido
              </span>
            )}
            {project?.lastError && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                ⚠ {project.lastError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Pixel ID / Dataset ID" required>
              <Input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="1234567890123456"
              />
            </FormField>

            <FormField label="Versão da API">
              <Select value={apiVersion} onChange={(e) => setApiVersion(e.target.value)}>
                {API_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
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
              <Input
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                placeholder="TEST12345"
              />
            </FormField>

            <div className="col-span-1 sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Domínio de Tracking</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-2">Tipo de domínio</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="domainType"
                        value="default"
                        checked={domainType === 'default'}
                        onChange={() => setDomainType('default')}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      Usar domínio padrão TrackServer
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="domainType"
                        value="custom"
                        checked={domainType === 'custom'}
                        onChange={() => setDomainType('custom')}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      Usar domínio próprio
                    </label>
                  </div>
                </div>

                {domainType === 'default' ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Domínio padrão inicial</label>
                    <div className="text-sm font-mono text-gray-700 select-all bg-white px-3 py-2 rounded-lg border border-gray-200 inline-block">
                      {project?.defaultDomain || 'carregando...'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      O projeto responderá automaticamente no domínio padrão do sistema. Nenhuma configuração de DNS adicional é necessária.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FormField label="Domínio próprio do cliente" hint="Ex: track.nomedacliente.com.br. Aponte um registro CNAME para o alvo indicado abaixo">
                      <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="track.minhaloja.com.br"
                      />
                    </FormField>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-60"
            >
              {saveMut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            {saved && (
              <span className="text-sm text-teal-600 font-medium">✓ Configurações salvas!</span>
            )}
            {saveMut.isError && (
              <span className="text-sm text-red-500">Erro ao salvar. Tente novamente.</span>
            )}
          </div>
        </div>

        {/* Bloco B — Captura de Formulários */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Captura de Formulários</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Define quais botões disparam eventos automaticamente. Separe múltiplos textos com vírgula.
              </p>
            </div>
            <button
              onClick={addRule}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
            >
              + Adicionar regra
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma regra configurada. Clique em "Adicionar regra" para começar.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Texto do botão</label>
                    <input
                      type="text"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                      placeholder="quero meu desconto, cadastrar, enviar"
                      value={rule.buttonText.join(', ')}
                      onChange={(e) => updateRuleTexts(i, e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Separe múltiplos textos com vírgula</p>
                  </div>
                  <div className="sm:w-44">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Evento</label>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
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
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
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

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => saveRulesMut.mutate()}
              disabled={saveRulesMut.isPending}
              className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-60"
            >
              {saveRulesMut.isPending ? 'Salvando...' : 'Salvar regras'}
            </button>
            {rulesSaved && <span className="text-sm text-teal-600 font-medium">✓ Regras salvas!</span>}
            {saveRulesMut.isError && <span className="text-sm text-red-500">Erro ao salvar.</span>}
          </div>
        </div>

        {/* Bloco C — URLs de Webhook */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-800">URLs de Webhook</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cole estas URLs nas plataformas de pagamento para enviar eventos de compra automaticamente ao Meta.
            </p>
          </div>
          {project && (
            <div className="space-y-3">
              {[
                { label: 'Kiwify', platform: 'kiwify', color: 'violet' },
                { label: 'Hotmart', platform: 'hotmart', color: 'orange' },
              ].map(({ label, platform, color }) => {
                const base = window.location.origin.replace(/-front\./, '-api.');
                const url = `${base}/webhook/${platform}?source_id=${project.id}`;
                return (
                  <div key={platform} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-${color}-100 text-${color}-700 w-16 text-center shrink-0`}>
                      {label}
                    </span>
                    <code className="flex-1 text-xs font-mono text-gray-700 break-all">{url}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="shrink-0 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                    >
                      Copiar
                    </button>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 mt-1">
                Para validação por assinatura, configure <code className="bg-gray-100 px-1 rounded">KIWIFY_WEBHOOK_SECRET</code> ou <code className="bg-gray-100 px-1 rounded">HOTMART_WEBHOOK_SECRET</code> nas variáveis de ambiente da API.
              </p>
            </div>
          )}
        </div>

        {/* Bloco D — Gerador de Script */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Script de Instalação</h2>
            {project?.firstEventAt && (
              <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                ✓ Pixel detectado
              </span>
            )}
          </div>

          {snippetLoading ? (
            <Skeleton className="h-40" />
          ) : snippetData ? (
            <>
              <CodeBlock code={snippetData.script} />

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-900 mb-2">Instrução de CNAME</p>
                <p className="text-xs text-amber-700">
                  Aponte um registro CNAME do seu domínio para{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">
                    {snippetData.cnameTarget}
                  </code>
                </p>
                <div className="mt-2 font-mono text-xs bg-amber-100 px-3 py-2 rounded text-amber-900">
                  {snippetData.clientCname} → {snippetData.cnameTarget}
                </div>
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">
                  Cole este script no <code className="bg-gray-200 px-1 rounded">&lt;head&gt;</code> de todas as páginas do cliente.
                  O script inicializa o SDK first-party e envia eventos automaticamente para o Meta.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Configure o Pixel ID acima para gerar o script.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
