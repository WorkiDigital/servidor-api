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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{label}</div>
        <div className="text-3xl font-bold text-gray-900 tabular-nums">{formatValue(value, format)}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}
