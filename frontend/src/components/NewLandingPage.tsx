import { Box, Container, Typography, Button, Grid, Paper, Divider } from '@mui/material';
import { CalendarMonth, LocationOn, Favorite } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function NewLandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#F4F1EA', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    position: 'relative',
                    minHeight: { xs: '100vh', md: '110vh' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    backgroundImage: 'url(/img/hero-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(44, 62, 80, 0.70)',
                    }
                }}
            >
                <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 10 }, px: { xs: 3, md: 4 } }}>
                    {/* Título Principal */}
                    <Typography
                        variant="h2"
                        sx={{
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            color: 'white',
                            mb: 3,
                            fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                            letterSpacing: '0.02em',
                            lineHeight: 1.3
                        }}
                    >
                        1ª Formação Arquidiocesana
                        <br />
                        Bom Pastor
                    </Typography>

                    {/* Tema */}
                    <Typography
                        variant="h5"
                        sx={{
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 300,
                            color: '#D4A373',
                            mb: 4,
                            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                            lineHeight: 1.5,
                            px: { xs: 1, md: 0 }
                        }}
                    >
                        Bom Pastor: Caminho de Misericórdia, Acolhida e Sinodalidade
                    </Typography>

                    {/* Lema Bíblico */}
                    <Typography
                        variant="body1"
                        sx={{
                            fontStyle: 'italic',
                            color: 'white',
                            mb: 6,
                            fontSize: { xs: '0.95rem', md: '1.15rem' },
                            opacity: 0.95,
                            px: { xs: 2, md: 0 }
                        }}
                    >
                        "Não vim para condenar, mas para salvar" - Jo 3, 17
                    </Typography>

                    {/* CTA */}
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{
                            bgcolor: '#D4A373',
                            color: 'white',
                            px: { xs: 4, md: 6 },
                            py: { xs: 1.5, md: 2 },
                            fontSize: { xs: '1rem', md: '1.1rem' },
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 20px rgba(212, 163, 115, 0.4)',
                            '&:hover': {
                                bgcolor: '#C08D5A',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(212, 163, 115, 0.5)',
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Inscreva-se
                    </Button>
                </Container>
            </Box>

            {/* Sobre o Encontro */}
            <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, px: { xs: 3, md: 4 } }}>
                <Typography
                    variant="h3"
                    align="center"
                    sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        color: '#2C3E50',
                        mb: 3,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                    }}
                >
                    Sobre o Encontro
                </Typography>

                <Typography
                    variant="body1"
                    align="center"
                    sx={{
                        fontSize: { xs: '1.05rem', md: '1.2rem' },
                        color: '#555',
                        mb: 6,
                        lineHeight: 1.8,
                        px: { xs: 1, md: 2 }
                    }}
                >
                    Um momento de acolhimento, reflexão e comunhão. Venha vivenciar uma experiência de formação
                    pastoral inspirada nos ensinamentos do Bom Pastor, em um ambiente de fraternidade e espiritualidade.
                </Typography>

                {/* Cards de Informações */}
                <Grid container spacing={4} sx={{ mt: 4 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #E8E5DE',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-4px)'
                                }
                            }}
                        >
                            <CalendarMonth sx={{ fontSize: 48, color: '#6B9AC4', mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2C3E50', mb: 1 }}>
                                Quando
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                24 a 26 de abril de 2026
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #E8E5DE',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-4px)'
                                }
                            }}
                        >
                            <LocationOn sx={{ fontSize: 48, color: '#6B9AC4', mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2C3E50', mb: 1 }}>
                                Onde
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Catedral Metropolitana do Divino Espírito Santo
                                <br />
                                Palmas - TO
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'white',
                                borderRadius: 3,
                                border: '1px solid #E8E5DE',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-4px)'
                                }
                            }}
                        >
                            <Favorite sx={{ fontSize: 48, color: '#6B9AC4', mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2C3E50', mb: 1 }}>
                                Formato
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Encontro presencial
                                <br />
                                com acolhimento pastoral
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Pilares Temáticos */}
            <Box sx={{ bgcolor: 'white', py: 10 }}>
                <Container maxWidth="md">
                    <Typography
                        variant="h3"
                        align="center"
                        sx={{
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            color: '#2C3E50',
                            mb: 6
                        }}
                    >
                        Pilares do Encontro
                    </Typography>

                    <Grid container spacing={3}>
                        {['Misericórdia', 'Acolhida', 'Sinodalidade'].map((pilar, index) => (
                            <Grid size={12} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderLeft: '4px solid #D4A373',
                                        bgcolor: '#FAFAF8'
                                    }}
                                >
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontFamily: '"Playfair Display", serif',
                                            fontWeight: 600,
                                            color: '#2C3E50'
                                        }}
                                    >
                                        {pilar}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Investimento */}
            <Container maxWidth="md" sx={{ py: 10 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        bgcolor: '#2C3E50',
                        color: 'white',
                        borderRadius: 3,
                        textAlign: 'center'
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            mb: 2
                        }}
                    >
                        Contribuição para Inscrição
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#D4A373', mb: 3 }}>
                        R$ 100,00
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
                        Inclui material de formação, coffee break e certificado de participação.
                    </Typography>

                    <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 3 }} />

                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                        <strong>Chave Pix:</strong> grayceperini@gmail.com
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Enviar comprovante para: 63 98405-5758 ou 63 98405-5758
                    </Typography>
                </Paper>
            </Container>

            {/* CTA Final */}
            <Box sx={{ bgcolor: '#F4F1EA', py: 10, textAlign: 'center' }}>
                <Container maxWidth="sm">
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700,
                            color: '#2C3E50',
                            mb: 3
                        }}
                    >
                        Participe Conosco
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#555', mb: 4, fontSize: '1.1rem' }}>
                        Faça sua inscrição e seja parte deste momento de formação e comunhão.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{
                            bgcolor: '#2C3E50',
                            color: 'white',
                            px: 5,
                            py: 2,
                            fontSize: '1.1rem',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: '#1a252f',
                            }
                        }}
                    >
                        Fazer Inscrição
                    </Button>
                </Container>
            </Box>

            {/* Rodapé */}
            <Box sx={{ bgcolor: '#2C3E50', color: 'white', py: 4, textAlign: 'center' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                        Palmas - TO
                    </Typography>
                    <Box
                        component="img"
                        src="/img/logo.png"
                        alt="Logo"
                        sx={{
                            width: 40,
                            height: 40,
                            objectFit: 'contain',
                            opacity: 0.6,
                            mb: 2
                        }}
                    />
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                        © 2026 Bom Pastor Digital. Todos os direitos reservados.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
