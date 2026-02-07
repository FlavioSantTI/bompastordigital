import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Menu, MenuItem, Avatar, Tooltip } from '@mui/material';
import { Church, Event, People, Dashboard, Logout, AccountCircle, Assessment } from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Dioceses', icon: <Church />, path: '/admin/dioceses' },
    { text: 'Eventos', icon: <Event />, path: '/admin/eventos' },
    { text: 'Inscrições', icon: <People />, path: '/admin/inscricoes' },
    { text: 'Relatórios & Fichas', icon: <Assessment />, path: '/admin/relatorios' },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
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
        <Box sx={{ display: 'flex' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, flexGrow: 1 }}>
                        BOM PASTOR DIGITAL - Administração
                    </Typography>

                    {user && (
                        <div>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    {user.email}
                                </Typography>
                                <Tooltip title="Minha Conta">
                                    <IconButton
                                        size="large"
                                        aria-label="account of current user"
                                        aria-controls="menu-appbar"
                                        aria-haspopup="true"
                                        onClick={handleMenu}
                                        color="inherit"
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
                                <MenuItem disabled>Perfil</MenuItem>
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
            </AppBar>

            {/* Drawer (menu lateral) */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <Divider />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout />
                            </ListItemIcon>
                            <ListItemText primary="Sair" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>

            {/* Conteúdo principal */}
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
}
