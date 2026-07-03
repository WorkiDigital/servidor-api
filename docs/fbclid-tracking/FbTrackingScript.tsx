'use client';

import { useEffect } from 'react';
import { initFbTracking } from './fbTracking';

/**
 * Client Component que dispara a captura/propagação de fbp/fbc/UTMs.
 *
 * App Router: importe e renderize uma vez em app/layout.tsx, dentro do <body>.
 * Pages Router: renderize uma vez em pages/_app.tsx.
 *
 * Roda depois que o DOM já está montado (equivalente ao DOMContentLoaded),
 * então os links estáticos do HTML já existem quando o script os varre.
 */
export default function FbTrackingScript() {
  useEffect(() => {
    initFbTracking();
  }, []);

  return null;
}
