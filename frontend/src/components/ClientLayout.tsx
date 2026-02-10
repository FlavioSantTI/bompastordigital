import { Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import { Logout, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            {/* AppBar */}
            <AppBar position="static" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        {/* Logo / Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Box
                                component="img"
                                src="/img/logo.png"
                                alt="Logo"
                                sx={{
                                    width: 40,
                                    height: 40,
                                    objectFit: 'contain',
                                    mr: 2
                                }}
                            />
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#1E3A5F' }}>
                                BOM PASTOR DIGITAL
                            </Typography>
                        </Box>

                        {/* User Info + Sair */}
                        {user && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccountCircle sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            display: { xs: 'none', sm: 'block' },
                                            color: 'text.secondary',
                                            maxWidth: 200,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {user.email}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<Logout fontSize="small" />}
                                    onClick={handleLogout}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        px: 2
                                    }}
                                >
                                    Sair
                                </Button>
                            </Box>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Conteúdo Principal */}
            <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
                <Container maxWidth="md">
                    {children}
                </Container>
            </Box>

            {/* Footer Simples */}
            <Box component="footer" sx={{ py: 3, textAlign: 'center', bgcolor: 'transparent' }}>
                <Typography variant="caption" color="text.secondary">
                    © 2026 Bom Pastor Digital. Todos os direitos reservados.
                </Typography>
            </Box>
        </Box>
    );
}
