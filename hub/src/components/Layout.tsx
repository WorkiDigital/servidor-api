import { useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Settings, Users, LogOut, Menu, Activity, BarChart2, Sun, Moon, Plus, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { listProjects, createProject } from '../api/projects';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

interface LayoutProps {
  children: React.ReactNode;
  projectName?: string;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  
  const qc = useQueryClient();
  const { data: workspaces, isLoading } = useQuery({ queryKey: ['projects'], queryFn: listProjects });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const createMut = useMutation({
    mutationFn: () => createProject(newName, newDomain || undefined),
    onSuccess: (newProject) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setNewName('');
      setNewDomain('');
      navigate(`/hub/projects/${newProject.id}/dashboard`);
    },
  });

  const activeWorkspace = workspaces?.find(w => w.id === id) || workspaces?.[0];
  const targetId = activeWorkspace?.id;

  const nav: NavItem[] = targetId
    ? [
        { label: 'Dashboard', icon: <LayoutDashboard size={16} />, to: `/hub/projects/${targetId}/dashboard` },
        { label: 'Relatório UTM', icon: <BarChart2 size={16} />, to: `/hub/projects/${targetId}/utm` },
        { label: 'Explorador de Leads', icon: <Users size={16} />, to: `/hub/projects/${targetId}/leads` },
        { label: 'Configurações', icon: <Settings size={16} />, to: `/hub/projects/${targetId}/config` },
      ]
    : [];

  const isActive = (to: string) => location.pathname === to || (to.includes('/config') && location.pathname.includes('/config'));

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-secondary)',
  };

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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
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
          className="h-16 flex items-center px-4 gap-4 relative z-20"
          style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            className="lg:hidden p-2 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          
          {/* Workspace Selector */}
          <div className="relative">
            {isLoading ? (
               <div className="w-40 h-9 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--nav-hover-bg)' }}></div>
            ) : (
              <>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: showDropdown ? 'var(--nav-hover-bg)' : 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => { if (!showDropdown) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
                  onMouseLeave={(e) => { if (!showDropdown) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                    {activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}
                  </div>
                  <span className="truncate max-w-[150px]">{activeWorkspace?.name || 'Selecione...'}</span>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                    <div
                      className="absolute top-full left-0 mt-2 w-64 rounded-2xl py-2 z-20 shadow-2xl"
                      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="px-3 py-2 text-xs font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-faint)' }}>
                        Seus Workspaces
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {workspaces?.map(w => (
                          <button
                            key={w.id}
                            onClick={() => {
                              navigate(location.pathname.replace(activeWorkspace?.id || '', w.id));
                              setShowDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-all"
                            style={{
                              backgroundColor: w.id === activeWorkspace?.id ? 'var(--nav-hover-bg)' : 'transparent',
                              color: w.id === activeWorkspace?.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => { if (w.id !== activeWorkspace?.id) e.currentTarget.style.backgroundColor = 'var(--nav-hover-bg)'; }}
                            onMouseLeave={(e) => { if (w.id !== activeWorkspace?.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                              {w.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate flex-1">{w.name}</span>
                            {w.id === activeWorkspace?.id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>}
                          </button>
                        ))}
                      </div>

                      <div className="px-3 pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={() => { setShowDropdown(false); setShowCreate(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{ color: 'var(--accent)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-bg)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Plus size={16} />
                          Criar novo workspace
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

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
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium hidden sm:flex"
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
        <main className="flex-1 p-6 overflow-auto relative z-0">
          {children}
        </main>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Novo Workspace</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Nome do workspace <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="minha-loja"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Domínio do cliente
                </label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="track.minhaloja.com.br"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                Cancelar
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!newName || createMut.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                  color: 'var(--bg-surface)',
                }}
              >
                {createMut.isPending ? 'Criando...' : 'Criar workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
