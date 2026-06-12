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
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
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
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
          </div>
        </div>

        {confirmWord && (
          <div
            className="mb-5 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-input)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Digite{' '}
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{confirmWord}</span>{' '}
              para confirmar:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all placeholder:text-slate-600"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-input)';
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
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-soft)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
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
                : { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--bg-surface)' }
            }
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
