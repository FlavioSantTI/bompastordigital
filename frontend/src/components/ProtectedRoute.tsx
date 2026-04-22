import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    // 1. Enquanto está carregando → Exibe spinner
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // 2. Não está logado → Manda pro Login
    if (!user) {
        console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. É rota de admin mas o cargo (role) ainda não foi resolvido → Continua carregando
    if (requireAdmin && role === null) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // 4. É rota de admin mas usuário não é admin → Manda pra inscrição
    if (requireAdmin && role !== 'admin') {
        console.log('[ProtectedRoute] Usuário não é admin, redirecionando para /inscricao');
        return <Navigate to="/inscricao" replace />;
    }

    // 5. Tudo certo → Renderiza o conteúdo
    return <Outlet />;
}
