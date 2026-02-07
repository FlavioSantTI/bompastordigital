import { Box, AppBar, Toolbar, Typography, Container, IconButton, Menu, MenuItem, Tooltip, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleClose();
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
                                sx={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #1E3A5F 0%, #6B9AC4 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold', fontSize: '1rem', fontFamily: '"Playfair Display", serif',
                                    mr: 2
                                }}
                            >
                                BP
                            </Box>
                            <Typography variant="h6" component="div" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#1E3A5F' }}>
                                BOM PASTOR DIGITAL
                            </Typography>
                        </Box>

                        {/* User Menu */}
                        {user && (
                            <div>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
                                        {user.email}
                                    </Typography>
                                    <Tooltip title="Minha Conta">
                                        <IconButton
                                            size="large"
                                            onClick={handleMenu}
                                            color="primary"
                                        >
                                            <AccountCircle />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                >
                                    <MenuItem disabled>Minha Inscrição</MenuItem>
                                    <Divider />
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <Logout fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Sair</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </div>
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
