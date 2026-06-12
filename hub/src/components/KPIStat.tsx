interface KPIStatProps {
  label: string;
  value: number | string;
  sublabel?: string;
  color: string;
  format?: 'number' | 'currency';
}

function formatValue(value: number | string, format?: 'number' | 'currency'): string {
  if (typeof value === 'string') return value;
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function KPIStat({ label, value, sublabel, color, format }: KPIStatProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:translate-y-[-1px]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="p-4">
        <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
          {label}
        </div>
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatValue(value, format)}
        </div>
        {sublabel && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
