import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { ProjectConfig } from './pages/ProjectConfig';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Events } from './pages/Events';
import { Integrations } from './pages/Integrations';
import { Platforms } from './pages/Platforms';
import { Installation } from './pages/Installation';
import { UTMReport } from './pages/UTMReport';
import { WorkspaceRedirector } from './pages/WorkspaceRedirector';
import { isAuthenticated } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/hub/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/hub/login" element={<Login />} />
          <Route
            path="/hub"
            element={<AuthGuard><WorkspaceRedirector /></AuthGuard>}
          />
          <Route
            path="/hub/projects"
            element={<Navigate to="/hub" replace />}
          />
          <Route
            path="/hub/projects/:id/dashboard"
            element={<AuthGuard><Dashboard /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/config"
            element={<AuthGuard><ProjectConfig /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/leads"
            element={<AuthGuard><Leads /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/events"
            element={<AuthGuard><Events /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/integrations"
            element={<AuthGuard><Integrations /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/platforms"
            element={<AuthGuard><Platforms /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/install"
            element={<AuthGuard><Installation /></AuthGuard>}
          />
          <Route
            path="/hub/projects/:id/utm"
            element={<AuthGuard><UTMReport /></AuthGuard>}
          />
          <Route path="/" element={<Navigate to="/hub" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
