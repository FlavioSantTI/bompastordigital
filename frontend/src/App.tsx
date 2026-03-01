import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Suspense, lazy } from 'react';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes Públicos e de carregamento rápido
import LandingPage from './components/LandingPage';
import NewLandingPage from './components/NewLandingPage';
import LoginPage from './components/admin/LoginPage';
import RegisterPage from './components/admin/RegisterPage';
import ParticipantDashboard from './components/ParticipantDashboard';
import ClientLayout from './components/ClientLayout';

// Componentes Protegidos (Área Administrativa) - Lazy Loading
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const DashboardPage = lazy(() => import('./components/admin/DashboardPage'));
const UpdatePasswordPage = lazy(() => import('./components/admin/UpdatePasswordPage'));
const DiocesesPage = lazy(() => import('./components/admin/DiocesesPage'));
const EventosPage = lazy(() => import('./components/admin/EventosPage'));
const InscricoesPage = lazy(() => import('./components/admin/InscricoesPage'));
const ReportsPage = lazy(() => import('./components/admin/ReportsPage'));

// Fallback de Loading para as rotas Lazy
const LazyLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress color="primary" />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<NewLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/update-password" element={
              <Suspense fallback={<LazyLoader />}>
                <UpdatePasswordPage />
              </Suspense>
            } />

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
              <Route path="/admin" element={
                <Suspense fallback={<LazyLoader />}>
                  <AdminLayout />
                </Suspense>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="dioceses" element={<DiocesesPage />} />
                <Route path="eventos" element={<EventosPage />} />
                <Route path="inscricoes" element={<InscricoesPage />} />
                <Route path="relatorios" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Rota Padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
