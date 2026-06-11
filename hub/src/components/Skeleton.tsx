export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: '#1a1f2e' }}
    />
  );
}

export function KPISkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#0d1018', border: '1px solid #1a1f2e' }}
    >
      <div style={{ height: 2, backgroundColor: '#1a1f2e' }} />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}
