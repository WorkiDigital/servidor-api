import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { Activity, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await login(user, password);
      localStorage.setItem('hub_token', token);
      navigate('/hub/projects');
    } catch {
      setError('Credenciais inválidas. Verifique usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,212,191,0.1)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-input)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.07) 0%, var(--bg-base) 65%)',
        backgroundColor: 'var(--bg-base)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--row-hover)',
        }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              boxShadow: '0 8px 28px rgba(45,212,191,0.28)',
            }}
          >
            <Activity size={22} className="text-white" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
          TrackServer Hub
        </h1>
        <p className="text-sm text-center mb-7" style={{ color: 'var(--text-faint)' }}>
          Acesso administrativo
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Usuário
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600"
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-soft)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'; }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-xs px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 mt-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'var(--bg-surface)',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(45,212,191,0.22)',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-dim)' }}>
            Modo mock: user=admin / senha=admin
          </p>
        )}
      </div>
    </div>
  );
}
