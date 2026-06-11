import { useState } from 'react';
import { Input } from './FormField';
import { Eye, EyeOff } from 'lucide-react';

interface TokenInputProps {
  hasToken: boolean;
  tokenMasked?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function TokenInput({ hasToken, tokenMasked, value, onChange, placeholder }: TokenInputProps) {
  const [replacing, setReplacing] = useState(false);
  const [show, setShow] = useState(false);

  if (hasToken && !replacing) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex-1 px-3 py-2 rounded-xl text-sm font-mono"
          style={{ backgroundColor: '#0a0d14', border: '1px solid #1e2438', color: '#475569' }}
        >
          {tokenMasked || '•••• ••••'}
        </div>
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="text-xs font-medium whitespace-nowrap transition-colors"
          style={{ color: '#2dd4bf' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#5eead4'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#2dd4bf'; }}
        >
          Substituir
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'EAAxxxxxxxx...'}
        className="pr-16"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: '#475569' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
