import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, Settings, Users, FolderOpen, LogOut, Menu, Activity, ChevronLeft, BarChart2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

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
  const { theme, toggle } = useTheme();

  const nav: NavItem[] = id
    ? [
        { label: 'Dashboard', icon: <LayoutDashboard size={16} />, to: `/hub/projects/${id}/dashboard` },
        { label: 'Relatório UTM', icon: <BarChart2 size={16} />, to: `/hub/projects/${id}/utm` },
        { label: 'Explorador de Leads', icon: <Users size={16} />, to: `/hub/projects/${id}/leads` },
        { label: 'Configuração Meta', icon: <Settings size={16} />, to: `/hub/projects/${id}/config` },
      ]
    : [];

  const isActive = (to: string) => location.pathname === to;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-base)' }}>
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
        style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                boxShadow: '0 4px 12px var(--accent-glow)',
              }}
            >
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">TrackServer</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Hub v5.0</div>
            </div>
          </div>
        </div>

        {/* Project name */}
        {projectName && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <Link
              to="/hub/projects"
              className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronLeft size={12} />
              Workspaces
            </Link>
            <div className="text-sm font-semibold mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
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
                  ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { color: 'var(--text-muted)', border: '1px solid transparent' }
              }
              onMouseEnter={(e) => {
                if (location.pathname !== '/hub/projects') {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--nav-hover-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/hub/projects') {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              <FolderOpen size={16} />
              Workspaces
            </Link>
          )}
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                isActive(item.to)
                  ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { color: 'var(--text-muted)', border: '1px solid transparent' }
              }
              onMouseEnter={(e) => {
                if (!isActive(item.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--nav-hover-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.to)) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
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
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { localStorage.removeItem('hub_token'); window.location.href = '/hub/login'; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--danger-bg)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)';
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
          style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            className="lg:hidden p-2 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              aria-label="Alternar tema"
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--nav-hover-text)';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--accent)' }}
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
