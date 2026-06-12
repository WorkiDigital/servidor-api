interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, children, className = '' }: ChartPanelProps) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-soft)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
