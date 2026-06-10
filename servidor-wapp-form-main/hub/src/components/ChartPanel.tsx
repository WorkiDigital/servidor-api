interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartPanel({ title, children, className = '' }: ChartPanelProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
