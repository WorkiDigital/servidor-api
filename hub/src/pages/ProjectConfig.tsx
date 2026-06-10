import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProjectMeta } from '../api/projects';
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setPixelId(project.pixelId || '');
      setDatasetId(project.datasetId || project.pixelId || '');
      setApiVersion(project.apiVersion || 'v22.0');
      setTestEventCode(project.testEventCode || '');
      setDomain(project.domain || '');
    }
  }, [project]);

  const saveMut = useMutation({
    mutationFn: () => updateProjectMeta(id!, {
      pixelId: pixelId || undefined,
      datasetId: datasetId || undefined,
      apiVersion,
      accessToken: accessToken || undefined,
      testEventCode: testEventCode || undefined,
      domain: domain || undefined,
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

            <FormField label="Domínio do cliente" hint="CNAME que aponta para o TrackServer">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="track.minhaloja.com.br"
                className="col-span-2"
              />
            </FormField>
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

        {/* Bloco B — Gerador de Script */}
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
