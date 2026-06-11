import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?script[^&]*&gt;)/g, '<span style="color:#569CD6">$1</span>')
    .replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:#6A9955">$1</span>')
    .replace(/'([^']*)'/g, '<span style="color:#CE9178">\'$1\'</span>')
    .replace(/(window\.\w+|function|var|return)/g, '<span style="color:#569CD6">$1</span>');

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #1e2438' }}>
      <div
        className="overflow-auto text-xs font-mono leading-relaxed p-4"
        style={{ background: '#080a10', color: '#d4d4d4', maxHeight: '320px' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={
          copied
            ? { backgroundColor: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }
            : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
        }
        onMouseEnter={(e) => {
          if (!copied) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.09)';
            (e.currentTarget as HTMLElement).style.color = '#94a3b8';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLElement).style.color = '#64748b';
          }
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}
