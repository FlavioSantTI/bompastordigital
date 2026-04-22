import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import NewLandingPage from './components/NewLandingPage';
import LoginPage from './components/admin/LoginPage';
import RegisterPage from './components/admin/RegisterPage';
import ParticipantDashboard from './components/ParticipantDashboard';
import ClientLayout from './components/ClientLayout';
import AgendaRedirect from './components/AgendaRedirect';

import AdminLayout from './components/admin/AdminLayout';
import DashboardPage from './components/admin/DashboardPage';
import UpdatePasswordPage from './components/admin/UpdatePasswordPage';
import DiocesesPage from './components/admin/DiocesesPage';
import EventosPage from './components/admin/EventosPage';
import InscricoesPage from './components/admin/InscricoesPage';
import ReportsPage from './components/admin/ReportsPage';
import UsuariosPage from './components/admin/UsuariosPage';
import CrachasPage from './components/admin/CrachasPage';
import CronogramaPage from './components/admin/CronogramaPage';
import CronogramaPublico from './components/CronogramaPublico';
import { PresencaQRCodePage } from './components/admin/PresencaQRCodePage';

// Fallback de Loading para as rotas Lazy
const LazyLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress color="primary" />
  </Box>
);

// Componente para redirecionamento inteligente na raiz
const AuthRedirect = () => {
    const { user, role, loading } = useAuth();

    if (loading) return <LazyLoader />;

    if (!user) return <Navigate to="/login" replace />;

    if (role === 'admin') return <Navigate to="/admin" replace />;
    
    return <Navigate to="/inscricao" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={
              <AuthRedirect />
            } />
            <Route path="/landing" element={<NewLandingPage />} />
            <Route path="/cronograma/:eventoId" element={<CronogramaPublico />} />
            <Route path="/agenda" element={<AgendaRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Rota Protegida: Área do Casal (Inscrição) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/inscricao" element={
                <ClientLayout>
                  <ParticipantDashboard />
                </ClientLayout>
              } />
            </Route>

            {/* Rota Protegida: Área Administrativa - Requer Admin */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="dioceses" element={<DiocesesPage />} />
                <Route path="eventos" element={<EventosPage />} />
                <Route path="inscricoes" element={<InscricoesPage />} />
                <Route path="relatorios" element={<ReportsPage />} />
                <Route path="crachas" element={<CrachasPage />} />
                <Route path="cronograma" element={<CronogramaPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="presenca" element={<PresencaQRCodePage />} />
              </Route>
            </Route>

            {/* Rota Padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
