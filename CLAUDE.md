# TrackServer — CLAUDE.md

## Visão Geral
Plataforma de tracking first-party para Meta Conversions API. Composta por:
- **API** (`api/`) — Fastify + TypeScript, recebe eventos do browser e webhooks de plataformas de pagamento
- **Worker** (`worker/`) — consome fila Redis `queue:events`, envia ao Meta CAPI, salva em `events_log`
- **Hub** (`hub/`) — frontend React + Vite + TailwindCSS, painel administrativo
- **Postgres** — banco principal (`clients`, `events_log`)
- **Redis** — fila de eventos e deduplicação

## Skills Instaladas
As seguintes skills foram instaladas pelo usuário e devem ser usadas quando relevante:

```bash
npx skills add NOME_DO_REPOSITORIO --skill ui-ux-pro-max
npx skills add vercel-labs/agent-skills --skill frontend-design -g
```

**Ao melhorar UI/UX do hub, sempre usar as skills `ui-ux-pro-max` e `frontend-design`.**

## Infraestrutura (Easypanel)
- API: `https://servidor-form-track-servidor-api.ubufeb.easypanel.host`
- Frontend Hub: `https://servidor-form-track-servidor-front.ubufeb.easypanel.host`
- Deploy: automático via push para `main` no GitHub (`WorkiDigital/servidor-api`)

## Estrutura de Rotas da API
- `POST /api/v1/event` — evento browser (snippet JS)
- `POST /api/v1/server-event` — evento server-side (autenticado)
- `POST /webhook/kiwify?source_id=UUID` — webhook Kiwify
- `POST /webhook/hotmart?source_id=UUID` — webhook Hotmart
- `GET/PUT /admin/projects/:id/form-capture` — regras de captura de formulário
- `GET /admin/projects/:id/metrics` — métricas do dashboard
- `GET /admin/projects/:id/leads` — lista de leads
- `DELETE /admin/projects/:id/leads` — apagar todos os leads (header `X-Confirm: delete-all`)

## Padrões Importantes
- **Deduplicação**: Redis `SET NX` com TTL 24h antes de enfileirar qualquer evento (`dedup:{client_id}:{event_id}`)
- **Geo IP**: `api/src/lib/geo.ts` usa `geoip-lite` (offline). Dados salvos em `metadata.geo_city/geo_state/geo_country`
- **Hashing**: `user_data` é hasheado SHA-256 antes de enviar ao Meta. Dados legíveis ficam em `metadata`
- **CORS**: `PUT` e `X-Confirm` já estão nos headers permitidos
- **rawBody**: removido do Fastify — não usar `addContentTypeParser` customizado

## Banco de Dados
- Tabela `clients`: inclui `form_capture_rules JSONB DEFAULT '[]'` (migration 002)
- Tabela `events_log`: `request_payload JSONB` contém o evento completo com `metadata.geo_*`

## Hub (Frontend)
- Stack: React + Vite + TailwindCSS + TanStack Query + Recharts
- Arquivos principais: `hub/src/pages/`, `hub/src/components/`, `hub/src/api/`
- `VITE_API_BASE_URL` — variável de ambiente apontando para a API
- Datas no Dashboard devem usar `useMemo` para evitar loop infinito de refetch

## Pendente / Próximos Passos
- Redesign completo do UX/UI do hub (usar skills `ui-ux-pro-max` e `frontend-design`)
- Adicionar mais plataformas de pagamento no webhook (ex: Eduzz, Monetizze, PerfectPay)
