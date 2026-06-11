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
        backgroundColor: '#0d1018',
        border: '1px solid #1a1f2e',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#252c40';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#1a1f2e';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="p-4">
        <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
          {label}
        </div>
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: '#f1f5f9' }}
        >
          {formatValue(value, format)}
        </div>
        {sublabel && (
          <div className="text-xs mt-1" style={{ color: '#334155' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
