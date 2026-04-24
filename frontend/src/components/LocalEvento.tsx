import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    Paper, 
    Button, 
    Stack,
    IconButton
} from '@mui/material';
import { 
    LocationOn, 
    DirectionsCar, 
    Map, 
    ArrowBack,
    Place,
    GridView
} from '@mui/icons-material';

export default function LocalEvento() {
    const { eventoId } = useParams<{ eventoId: string }>();
    const navigate = useNavigate();

    const endereco = "Praça dos Girassóis, Q 102 Sul, Catedral - Plano Diretor Sul, Palmas - TO";
    const linkMaps = "https://maps.app.goo.gl/7EpQMTcX8o3W7cYd8";

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', 
                bgcolor: '#fcf9f9',
                pb: 4
            }}
        >
            {/* Header Compacto */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #FF921C 0%, #ECA427 100%)',
                    color: 'white',
                    py: 2,
                    px: 2,
                    textAlign: 'center',
                    mb: 3,
                    position: 'relative'
                }}
            >
                <IconButton 
                    onClick={() => navigate('/central')}
                    sx={{ position: 'absolute', left: 16, top: 12, color: 'white' }}
                >
                    <ArrowBack />
                </IconButton>

                <Box 
                    component="img" 
                    src="/img/logo.jpg" 
                    alt="Logo Bom Pastor" 
                    sx={{ 
                        height: 40, 
                        mb: 0.5, 
                        borderRadius: '50%', 
                        border: '1px solid rgba(255,255,255,0.2)' 
                    }} 
                />
                <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: '"Playfair Display", serif', fontSize: '1.1rem' }}>
                    Localização
                </Typography>
            </Box>

            <Container maxWidth="sm">
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, 
                        borderRadius: 5, 
                        textAlign: 'center',
                        border: '1px solid #eee',
                        bgcolor: '#fff'
                    }}
                >
                    <Typography variant="h5" sx={{ color: '#333', mb: 3, fontWeight: 900, lineHeight: 1.2 }}>
                        Catedral do Divino Espírito Santo
                    </Typography>

                    <Box 
                        sx={{ 
                            p: 3, 
                            bgcolor: '#f8f9fa', 
                            borderRadius: 4, 
                            mb: 4,
                            border: '2px solid #FF921C'
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                            <LocationOn sx={{ color: '#FF921C', fontSize: 30 }} />
                            <Typography variant="h6" sx={{ color: '#000', fontWeight: 800, lineHeight: 1.3 }}>
                                {endereco}
                            </Typography>
                        </Stack>
                    </Box>

                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<DirectionsCar />}
                            href={linkMaps}
                            target="_blank"
                            sx={{ 
                                bgcolor: '#FF921C', 
                                '&:hover': { bgcolor: '#ECA427' },
                                borderRadius: 3,
                                py: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1.1rem'
                            }}
                        >
                            Abrir no GPS (Google Maps)
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Dica: Clique no link acima para abrir a rota direto no seu celular. 🚗💨
                        </Typography>
                    </Stack>
                </Paper>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button 
                        startIcon={<GridView sx={{ color: '#FF921C' }} />}
                        onClick={() => navigate('/central')}
                        sx={{ 
                            color: '#FF921C', 
                            textTransform: 'none', 
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            '&:hover': { bgcolor: 'rgba(255, 146, 28, 0.05)' }
                        }}
                    >
                        Voltar ao Hub
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
