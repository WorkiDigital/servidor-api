# Captura e propagação de fbp/fbc + UTMs para checkout externo (Kiwify)

## Arquivos
- `fbTracking.ts` — lógica pura (sem JSX), pode ser usada em qualquer projeto JS/TS.
- `FbTrackingScript.tsx` — wrapper de Client Component para Next.js.

## Instalação

1. Copie os dois arquivos para o seu projeto, ex: `src/lib/fbTracking.ts` e
   `src/components/FbTrackingScript.tsx` (ajuste o import relativo em
   `FbTrackingScript.tsx` se mudar os caminhos).

2. **App Router** (`app/layout.tsx`):

```tsx
import FbTrackingScript from '@/components/FbTrackingScript';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <FbTrackingScript />
        {children}
      </body>
    </html>
  );
}
```

   **Pages Router** (`pages/_app.tsx`):

```tsx
import FbTrackingScript from '@/components/FbTrackingScript';

export default function App({ Component, pageProps }) {
  return (
    <>
      <FbTrackingScript />
      <Component {...pageProps} />
    </>
  );
}
```

3. `CHECKOUT_HOSTS` em `fbTracking.ts` já cobre **vários checkouts/plataformas
   ao mesmo tempo** — Kiwify, Hotmart, Eduzz, PerfectPay, Monetizze. O script
   varre a página inteira e aplica os parâmetros em **qualquer** link (ou
   botão com `data-href`/`data-checkout-url`) cujo domínio bata com a lista,
   então funciona tanto para múltiplos CTAs do mesmo produto quanto para
   várias ofertas/produtos diferentes na mesma landing page. Adicione ou
   remova domínios conforme as plataformas que você realmente usa.

4. Antes de subir para produção, mude `DEBUG = true` para `DEBUG = false`
   no topo de `fbTracking.ts` para remover os `console.log`.

## Como validar no navegador

1. Acesse a landing page com `?fbclid=teste123&utm_source=meta&utm_campaign=camp1`
   na URL (simula clique vindo de um anúncio).
2. Abra o DevTools → Console. Deve aparecer:
   ```
   [fbTracking] Valores capturados: { fbp: "fb.1...", fbc: "fb.1.<timestamp>.teste123", utms: {...}, fbclid_na_url: "teste123" }
   [fbTracking] N links verificados, params aplicados a links de checkout: {...}
   ```
   - `fbp` só aparece se o Pixel já tiver rodado e criado o cookie `_fbp`
     (o snippet do Pixel precisa carregar **antes** deste script, ou pelo
     menos antes do clique do usuário).
3. Inspecione (botão direito → Inspecionar) qualquer botão/link que aponte
   para `pay.kiwify.com.br` e confira que o `href` agora tem
   `?fbp=...&fbc=...&utm_source=...` anexados.
4. Clique no link e confira, na URL do checkout Kiwify, que os parâmetros
   chegaram.

## Notas importantes

- **Ordem de carregamento**: o Pixel do Meta precisa estar carregado antes
  deste script rodar, senão o cookie `_fbp` ainda não existe no primeiro
  render. Como o `useEffect` roda no mount do client, e o Pixel geralmente
  é injetado via `<Script strategy="afterInteractive">` do `next/script`,
  garanta que o Pixel use `strategy="beforeInteractive"` ou que este
  componente seja renderizado depois do Pixel na árvore/ordem de scripts.
- **Links renderizados dinamicamente**: a implementação já usa um
  `MutationObserver` no `<body>`, então links/botões de checkout que
  aparecem depois do carregamento inicial (modal, seção lazy-loaded, etc.)
  recebem os parâmetros automaticamente, sem precisar chamar nada de novo.
- **Kiwify → Conversions API**: no lado do servidor, seu webhook da Kiwify
  precisa ler `fbp`, `fbc` e as UTMs de volta (Kiwify geralmente devolve
  os query params recebidos na URL de checkout como metadata do pedido) e
  repassá-los nos campos `fbp`/`fbc`/`user_data` da Conversions API.
