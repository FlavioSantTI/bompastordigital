import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>

            {/* Logo Placeholder */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Box
                    component="img"
                    src="/img/logo.png"
                    alt="Logo Bom Pastor"
                    sx={{
                        width: 150,
                        height: 150,
                        objectFit: 'contain',
                        margin: '0 auto',
                        mb: 3,
                        display: 'block'
                    }}
                />
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
