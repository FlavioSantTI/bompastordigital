import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>

            {/* Logo Placeholder */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Box
                    sx={{
                        width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                        background: 'linear-gradient(135deg, #1E3A5F 0%, #6B9AC4 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '2.5rem', fontFamily: '"Playfair Display", serif',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 3
                    }}
                >
                    BP
                </Box>
                <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                    BOM PASTOR DIGITAL
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Sistema de Gestão de Encontros de Casais
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'transparent', maxWidth: 600, textAlign: 'center' }}>
                <Typography variant="body1" paragraph sx={{ mb: 4, fontSize: '1.1rem' }}>
                    Bem-vindo à plataforma de inscrições. Para participar dos próximos encontros,
                    por favor faça login ou crie sua conta gratuitamente.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained" size="large"
                        onClick={() => navigate('/login')}
                        sx={{ minWidth: 200, py: 1.5 }}
                    >
                        ENTRAR
                    </Button>
                    <Button
                        variant="outlined" size="large"
                        onClick={() => navigate('/register')}
                        sx={{ minWidth: 200, py: 1.5, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                        CRIAR CONTA
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
