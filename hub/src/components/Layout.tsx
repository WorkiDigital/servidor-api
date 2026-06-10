import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: string;
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
        { label: 'Dashboard', icon: '📊', to: `/hub/projects/${id}/dashboard` },
        { label: 'Configuração Meta', icon: '⚙️', to: `/hub/projects/${id}/config` },
        { label: 'Explorador de Leads', icon: '👥', to: `/hub/projects/${id}/leads` },
      ]
    : [];

  const isActive = (to: string) => location.pathname === to;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-sm font-bold">T</div>
            <div>
              <div className="text-sm font-bold text-gray-900">TrackServer</div>
              <div className="text-xs text-gray-400">Hub v5.0</div>
            </div>
          </div>
        </div>

        {/* Project name */}
        {projectName && (
          <div className="px-5 py-3 border-b border-gray-100">
            <Link to="/hub/projects" className="text-xs text-teal-600 hover:underline">← Todos os Projetos</Link>
            <div className="text-sm font-semibold text-gray-800 mt-1 truncate">{projectName}</div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {!id && (
            <Link
              to="/hub/projects"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/hub/projects'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>🗂️</span>
              Todos os Projetos
            </Link>
          )}
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { localStorage.removeItem('hub_token'); window.location.href = '/hub/login'; }}
            className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              online agora
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
