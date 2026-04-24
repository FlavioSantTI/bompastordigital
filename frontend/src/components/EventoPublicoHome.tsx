import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CardActionArea,
    CircularProgress,
    Button,
    useTheme
} from '@mui/material';
import { 
    EventNote, 
    CheckCircleOutline, 
    Tv,
    Place,
    GridView
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function EventoPublicoHome() {
    const { eventoId } = useParams<{ eventoId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    
    const [loading, setLoading] = useState(true);
    const [evento, setEvento] = useState<any>(null);

    useEffect(() => {
        if (eventoId) {
            fetchEvento();
        }
    }, [eventoId]);

    const fetchEvento = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('*')
                .eq('id', eventoId)
                .single();

            if (error) throw error;
            setEvento(data);
        } catch (err) {
            console.error('Erro ao buscar evento:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!evento) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography variant="h6" color="text.secondary">Evento não encontrado.</Typography>
            </Box>
        );
    }

    const menuItems = [
        {
            title: 'Programação',
            subtitle: 'Horários e locais',
            icon: <EventNote fontSize="large" />,
            route: `/cronograma/${eventoId}`,
            color: '#FF921C'
        },
        {
            title: 'Lista de Presença',
            subtitle: 'Status e registros',
            icon: <CheckCircleOutline fontSize="large" />,
            route: `/presenca-publica/${eventoId}`,
            color: '#FF921C'
        },
        {
            title: 'Check-in Digital',
            subtitle: 'QR Code Telão',
            icon: <Tv fontSize="large" />,
            route: '/presenca-viva',
            color: '#FF921C',
            dashed: true
        },
        {
            title: 'Localização',
            subtitle: 'Como chegar',
            icon: <Place fontSize="large" />,
            route: `/local/${eventoId}`,
            color: '#FF921C'
        }
    ];

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', 
                bgcolor: '#fcf9f9',
                pb: 4
            }}
        >
            {/* Header Section com Fundo Laranja */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #FF921C 0%, #ECA427 100%)',
                    color: 'white',
                    pt: 4,
                    pb: 4,
                    px: 2,
                    textAlign: 'center',
                    mb: 3, // Margem positiva para afastar os cards do fundo laranja
                    position: 'relative'
                }}
            >
                <Box 
                    component="img" 
                    src="/img/logo.jpg" 
                    alt="Logo Bom Pastor" 
                    sx={{ 
                        height: 60, 
                        mb: 1.5, 
                        borderRadius: '50%', 
                        border: '2px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                    }} 
                />
                
                <Typography 
                    sx={{ 
                        letterSpacing: 4, 
                        opacity: 0.9, 
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        mb: 1
                    }}
                >
                    PORTAL DO PARTICIPANTE
                </Typography>

                <Typography 
                    variant="h5" 
                    sx={{ 
                        fontWeight: 900, 
                        fontFamily: '"Playfair Display", serif',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        maxWidth: '90%',
                        mx: 'auto',
                        lineHeight: 1.2
                    }}
                >
                    {evento.nome}
                </Typography>
            </Box>

            <Container maxWidth="sm">

                {/* Navigation Cards Forced 2x2 Table */}
                <Box 
                    sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: 2,
                        width: '100%',
                        mb: 4
                    }}
                >
                    {menuItems.map((item, index) => (
                        <Card 
                            key={index}
                            elevation={4}
                            sx={{ 
                                borderRadius: 6, 
                                height: '100%',
                                minHeight: { xs: 150, md: 170 }, 
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                border: '2px solid transparent',
                                position: 'relative',
                                overflow: 'visible',
                                ...(item.dashed && { border: '1px dashed rgba(255, 146, 28, 0.3)' }),
                                '&:hover': { 
                                    transform: 'translateY(-10px)',
                                    boxShadow: '0 15px 35px rgba(255, 146, 28, 0.25)',
                                    borderColor: '#FF921C',
                                    bgcolor: 'rgba(255, 146, 28, 0.02)',
                                    '& .icon-box': {
                                        transform: 'scale(1.1) rotate(8deg)',
                                        bgcolor: 'rgba(255, 146, 28, 0.2)'
                                    }
                                },
                                '&:active': { transform: 'scale(0.95)' }
                            }}
                        >
                            <CardActionArea onClick={() => navigate(item.route)} sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
                                <CardContent sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                                    <Box 
                                        className="icon-box"
                                        sx={{ 
                                            bgcolor: 'rgba(255, 146, 28, 0.1)',
                                            p: 2,
                                            borderRadius: 4,
                                            color: '#FF921C',
                                            display: 'inline-flex',
                                            mb: 1.5,
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography variant="h6" fontWeight="900" sx={{ color: '#ECA427', lineHeight: 1.1, mb: 0.5, fontSize: { xs: '1.05rem', md: '1.25rem' } }}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1.1, fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                                        {item.subtitle}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 8, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, fontWeight: 700 }}>
                        © 2026 Bom Pastor Digital • **Versão 5.0**
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
