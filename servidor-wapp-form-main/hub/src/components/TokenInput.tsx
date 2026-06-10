import { useState } from 'react';
import { Input } from './FormField';

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
        <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono">
          {tokenMasked || '•••• ••••'}
        </div>
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="text-xs text-teal-600 hover:text-teal-800 font-medium whitespace-nowrap"
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
        className="pr-20"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
      >
        {show ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  );
}
