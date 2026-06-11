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
        backgroundColor: '#0d1018',
        border: '1px solid #1a1f2e',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#94a3b8' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
