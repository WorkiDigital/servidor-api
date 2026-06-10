# TrackServer Hub

Painel de administração do TrackServer — configuração Meta Pixel/CAPI, dashboard de métricas e explorador de leads.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- TanStack Query v5
- Recharts
- React Router DOM v6

## Setup de desenvolvimento

```bash
cd hub
cp .env.example .env
npm install
npm run dev
# Acesse http://localhost:5173/hub/
```

**Modo mock** (padrão, sem backend): defina `VITE_USE_MOCKS=true` no `.env`.  
Login: `admin` / `admin`

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_BASE_URL` | `` (vazio) | URL base da API Fastify |
| `VITE_USE_MOCKS` | `true` | `true` usa dados mockados localmente |

Com `VITE_USE_MOCKS=false`, o Hub consome a API real em `VITE_API_BASE_URL`.

## Build e deploy

```bash
cd hub
npm run build
# Gera hub/dist/
```

Copie `dist/` para o servidor:

```bash
rsync -avz dist/ user@servidor:/var/www/hub/
```

O Nginx já está configurado em `nginx/nginx.conf` para servir `/hub/*` via `alias /var/www/hub/`.  
O `docker-compose.yml` monta `./hub/dist:/var/www/hub:ro` no container nginx.

## Fluxo Docker completo

```bash
cd hub && npm run build && cd ..
docker compose up -d
# Hub disponível em https://seudominio.com/hub/
```

## Configurar novo cliente

1. Crie um projeto em **Projetos → Novo Projeto**
2. Vá em **Configuração Meta** e preencha:
   - Pixel ID / Dataset ID
   - Access Token (CAPI) — será criptografado, nunca exibido novamente em claro
   - Versão da API (padrão v22.0)
   - Domínio do cliente (onde será configurado o CNAME)
3. Copie o **Script de Instalação** gerado e cole no `<head>` de todas as páginas do cliente
4. Configure o CNAME indicado no painel DNS do cliente

## Segurança

- JWT em `localStorage` com interceptor axios
- Access Token nunca retorna ao front em claro (apenas últimos 4 chars)
- Rotas `/admin/*` protegidas por JWT no backend
- Ações destrutivas exigem confirmação dupla
