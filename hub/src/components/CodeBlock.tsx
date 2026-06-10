import { useState } from 'react';

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
    <div className="relative">
      <div
        className="rounded-xl overflow-auto text-xs font-mono leading-relaxed p-4"
        style={{ background: '#1e1e1e', color: '#d4d4d4', maxHeight: '320px' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <button
        onClick={handleCopy}
        className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          copied
            ? 'bg-teal-500 text-white'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
        }`}
      >
        {copied ? '✓ Copiado!' : 'Copiar script'}
      </button>
    </div>
  );
}
