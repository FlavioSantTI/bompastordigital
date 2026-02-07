import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // 1. Não está logado -> Manda pro Login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. É rota de admin mas usuário não é admin -> Manda pra Home (ou página de "Acesso Negado")
    if (requireAdmin && role !== 'admin') {
        // Opcional: Criar página de Unauthorized. Por enquanto joga pra home.
        return <Navigate to="/" replace />;
    }

    // 3. Tudo certo -> Renderiza o conteúdo
    return <Outlet />;
}
