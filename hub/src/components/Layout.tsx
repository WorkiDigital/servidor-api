import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Settings, Users, FolderOpen, LogOut, Menu, Activity, ChevronLeft } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

interface LayoutProps {
  children: React.ReactNode;
  projectName?: string;
}

export function Layout({ children, projectName }: LayoutProps) {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav: NavItem[] = id
    ? [
        { label: 'Dashboard', icon: <LayoutDashboard size={16} />, to: `/hub/projects/${id}/dashboard` },
        { label: 'Configuração Meta', icon: <Settings size={16} />, to: `/hub/projects/${id}/config` },
        { label: 'Explorador de Leads', icon: <Users size={16} />, to: `/hub/projects/${id}/leads` },
      ]
    : [];

  const isActive = (to: string) => location.pathname === to;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#080a10' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: '#0d1018', borderRight: '1px solid #1a1f2e' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: '1px solid #1a1f2e' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
                boxShadow: '0 4px 12px rgba(45, 212, 191, 0.25)',
              }}
            >
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">TrackServer</div>
              <div className="text-xs" style={{ color: '#475569' }}>Hub v5.0</div>
            </div>
          </div>
        </div>

        {/* Project name */}
        {projectName && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1a1f2e' }}>
            <Link
              to="/hub/projects"
              className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
              style={{ color: '#2dd4bf' }}
            >
              <ChevronLeft size={12} />
              Todos os Projetos
            </Link>
            <div className="text-sm font-semibold mt-1 truncate" style={{ color: '#e2e8f0' }}>
              {projectName}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {!id && (
            <Link
              to="/hub/projects"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                location.pathname === '/hub/projects'
                  ? { backgroundColor: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
                  : { color: '#64748b', border: '1px solid transparent' }
              }
              onMouseEnter={(e) => {
                if (location.pathname !== '/hub/projects') {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/hub/projects') {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                }
              }}
            >
              <FolderOpen size={16} />
              Todos os Projetos
            </Link>
          )}
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                isActive(item.to)
                  ? { backgroundColor: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
                  : { color: '#64748b', border: '1px solid transparent' }
              }
              onMouseEnter={(e) => {
                if (!isActive(item.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                }
              }}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid #1a1f2e' }}>
          <button
            onClick={() => { localStorage.removeItem('hub_token'); window.location.href = '/hub/login'; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: '#475569' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(248,113,113,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#475569';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-16 flex items-center px-4 gap-4"
          style={{ backgroundColor: '#0d1018', borderBottom: '1px solid #1a1f2e' }}
        >
          <button
            className="lg:hidden p-2 rounded-xl transition-all"
            style={{ color: '#64748b' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                backgroundColor: 'rgba(45,212,191,0.08)',
                color: '#2dd4bf',
                border: '1px solid rgba(45,212,191,0.2)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: '#2dd4bf' }}
              />
              online
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
