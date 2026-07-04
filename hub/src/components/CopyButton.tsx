import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={
        copied
          ? { backgroundColor: 'rgba(45,212,191,0.1)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
          : { backgroundColor: 'var(--nav-hover-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
      }
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}
