const INPUT_BASE: React.CSSProperties = {
  backgroundColor: '#0a0d14',
  border: '1px solid #1e2438',
  color: '#e2e8f0',
};

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: '#f87171' }}>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: '#334155' }}>{hint}</p>}
      {error && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', style, onFocus, onBlur, ...props }: InputProps) {
  const borderColor = error ? '#f87171' : '#1e2438';
  return (
    <input
      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600 ${className}`}
      style={{ ...INPUT_BASE, borderColor, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? '#f87171' : '#2dd4bf';
        e.currentTarget.style.boxShadow = error
          ? '0 0 0 3px rgba(239,68,68,0.1)'
          : '0 0 0 3px rgba(45,212,191,0.1)';
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? '#f87171' : '#1e2438';
        e.currentTarget.style.boxShadow = 'none';
        onBlur?.(e);
      }}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, className = '', style, onFocus, onBlur, children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${className}`}
      style={{ ...INPUT_BASE, borderColor: error ? '#f87171' : '#1e2438', ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#2dd4bf';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)';
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? '#f87171' : '#1e2438';
        e.currentTarget.style.boxShadow = 'none';
        onBlur?.(e);
      }}
      {...props}
    >
      {children}
    </select>
  );
}
