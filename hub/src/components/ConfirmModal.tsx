import { useState } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        {confirmWord && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              Digite <strong>{confirmWord}</strong> para confirmar:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder={confirmWord}
            />
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
