import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmWord?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmModal({ title, description, confirmWord, onConfirm, onCancel, danger = false }: ConfirmModalProps) {
  const [input, setInput] = useState('');
  const canConfirm = !confirmWord || input === confirmWord;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: '#0d1018',
          border: '1px solid #1a1f2e',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          {danger && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle size={16} style={{ color: '#f87171' }} />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#f1f5f9' }}>{title}</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>{description}</p>
          </div>
        </div>

        {confirmWord && (
          <div
            className="mb-5 p-3 rounded-xl"
            style={{ backgroundColor: '#080a10', border: '1px solid #1e2438' }}
          >
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>
              Digite{' '}
              <span className="font-bold" style={{ color: '#f1f5f9' }}>{confirmWord}</span>{' '}
              para confirmar:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all placeholder:text-slate-600"
              style={{ backgroundColor: '#0d1018', border: '1px solid #1e2438', color: '#e2e8f0' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f87171';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1e2438';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder={confirmWord}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#64748b', border: '1px solid #1a1f2e' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#64748b';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={
              danger
                ? { backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }
                : { background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', color: '#0d1018' }
            }
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
