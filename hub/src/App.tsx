import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/Login';
import { ProjectsList } from './pages/ProjectsList';
import { ProjectConfig } from './pages/ProjectConfig';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { UTMReport } from './pages/UTMReport';
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
            path="/hub/projects"
            element={<AuthGuard><ProjectsList /></AuthGuard>}
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
            path="/hub/projects/:id/utm"
            element={<AuthGuard><UTMReport /></AuthGuard>}
          />
          <Route path="/hub" element={<Navigate to="/hub/projects" replace />} />
          <Route path="/" element={<Navigate to="/hub/projects" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
