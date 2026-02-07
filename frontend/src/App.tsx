import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes Públicos
import LandingPage from './components/LandingPage';
import LoginPage from './components/admin/LoginPage';
import RegisterPage from './components/admin/RegisterPage';

// Componentes Protegidos (Usuário e Admin)
import ParticipantDashboard from './components/ParticipantDashboard';
import ClientLayout from './components/ClientLayout';
import AdminLayout from './components/admin/AdminLayout';
import DashboardPage from './components/admin/DashboardPage';
import UpdatePasswordPage from './components/admin/UpdatePasswordPage';
import DiocesesPage from './components/admin/DiocesesPage';
import EventosPage from './components/admin/EventosPage';
import InscricoesPage from './components/admin/InscricoesPage';
import ReportsPage from './components/admin/ReportsPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Rota Protegida: Área do Casal (Inscrição) - Requer Login (user ou admin) */}
            {/* Rota Protegida: Área do Casal (Inscrição) - Requer Login (user ou admin) */}
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
