import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Paper,
  Divider,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Heart,
  Send,
  Sparkles,
  Users,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Quote,
  ClipboardCheck,
  Share2,
  Menu as MenuIcon,
  X as CloseIcon,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../types';

// Tokens de Design (Conforme especificação UI/UX)
const TOKENS = {
  primary: '#1E3A8A',      // Azul Escuro Confiável
  accent: '#10B981',       // Verde Emerald (CTA de Alta Conversão)
  accentHover: '#059669',  // Verde Emerald Escuro para Hover
  bgLight: '#F8FAFC',      // Off-white / Slate 50
  border: '#D1D5DB',       // Cinza Claro
  textDark: '#374151',     // Cinza Escuro para Corpo
  textLight: '#6B7280',    // Cinza Médio
};

// Hook personalizado para Revelação em Scroll (IntersectionObserver)
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Anima apenas uma vez para fluidez máxima
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function RecadastramentoLandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll Reveal Hooks para seções principais
  const benefitsReveal = useScrollReveal();
  const quoteReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  const handleRegisterClick = () => {
    navigate('/login');
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Recadastramento Bom Pastor',
        text: 'Conectados no Amor do Bom Pastor - Faça seu recadastramento!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const navLinks = [
    { label: 'Início', href: '#hero' },
    { label: 'Por que Atualizar?', href: '#beneficios' },
    { label: 'Recadastrar', href: '#chamado' },
    { label: 'Contato', href: '#rodape' },
  ];

  const benefits = [
    {
      icon: <Heart style={{ width: 36, height: 36, color: TOKENS.primary }} />,
      title: 'Acompanhar melhor',
      description: 'Assistência espiritual e pastoral mais próxima das necessidades e momentos da sua família.',
      accent: TOKENS.primary,
      bg: '#EFF6FF',
    },
    {
      icon: <Send style={{ width: 36, height: 36, color: '#D97706' }} />,
      title: 'Comunicar com agilidade',
      description: 'Convites para formações, retiros e encontros sem desperdício de recursos e tempo.',
      accent: '#D97706',
      bg: '#FEF3C7',
    },
    {
      icon: <Sparkles style={{ width: 36, height: 36, color: TOKENS.accent }} />,
      title: 'Potencializar dons',
      description: 'Organizar ministérios de acordo com os talentos, carismas e disponibilidades únicas de cada casal.',
      accent: TOKENS.accent,
      bg: '#ECFDF5',
    },
    {
      icon: <Users style={{ width: 36, height: 36, color: '#DC2626' }} />,
      title: 'Fortalecer a comunhão',
      description: 'Confirmar o seu compromisso renovado com a nossa missão evangelizadora e fraternal.',
      accent: '#DC2626',
      bg: '#FEF2F2',
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: TOKENS.bgLight,
        minHeight: '100vh',
        color: TOKENS.textDark,
        overflowX: 'hidden',
        // Injeção de Keyframes Globais para Animações Suaves
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translate3d(0, 28px, 0)' },
          to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        },
        '@keyframes floatSlow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        '@keyframes pulseGlow': {
          '0%, 100%': { boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 12px 32px rgba(16, 185, 129, 0.65)' },
        },
      }}
    >
      {/* 🧩 4.1 Cabeçalho Sticky com Glassmorphism & Menu Responsivo */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 999,
          backdropFilter: 'saturate(180%) blur(12px)',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
          py: 1.5,
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            {/* Logos & Branding com Microinteração no Hover */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                component="img"
                src="/img/logo-bom-pastor-novo.jpg"
                alt="Logo Bom Pastor Digital"
                sx={{
                  height: 48,
                  width: 48,
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': { transform: 'scale(1.1) rotate(5deg)' },
                  cursor: 'pointer',
                }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
              <Box
                component="img"
                src="/img/logo-arquidiocese-palmas.png"
                alt="Logo Arquidiocese de Palmas"
                sx={{
                  height: 40,
                  width: 'auto',
                  display: { xs: 'none', sm: 'block' },
                  opacity: 0.9,
                  transition: 'opacity 0.2s ease',
                  '&:hover': { opacity: 1 },
                }}
              />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: `${TOKENS.primary} !important`,
                    fontSize: { xs: '1.05rem', sm: '1.2rem' },
                    lineHeight: 1.2,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Bom Pastor Digital
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: `${TOKENS.textLight} !important`, fontSize: '0.75rem', display: 'block' }}
                >
                  Pastoral Familiar • Palmas-TO
                </Typography>
              </Box>
            </Stack>

            {/* Desktop Navigation Links */}
            <Stack direction="row" spacing={3} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
              {navLinks.map((link, idx) => (
                <Typography
                  key={idx}
                  component="a"
                  href={link.href}
                  sx={{
                    color: `${TOKENS.textDark} !important`,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    position: 'relative',
                    py: 0.5,
                    transition: 'color 0.25s ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: 0,
                      height: '2px',
                      bgcolor: TOKENS.accent,
                      transition: 'width 0.3s ease',
                    },
                    '&:hover': {
                      color: `${TOKENS.accent} !important`,
                      '&::after': { width: '100%' },
                    },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>

            {/* Desktop Actions & CTA "Comece Agora" */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title="Compartilhar">
                <IconButton
                  onClick={handleShareClick}
                  size="small"
                  sx={{
                    color: TOKENS.primary,
                    transition: 'transform 0.25s ease, color 0.25s ease',
                    '&:hover': { transform: 'scale(1.15)', color: TOKENS.accent },
                  }}
                >
                  <Share2 size={20} />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                onClick={handleRegisterClick}
                aria-label="Comece agora seu recadastramento"
                sx={{
                  bgcolor: `${TOKENS.accent} !important`,
                  background: `${TOKENS.accent} !important`,
                  color: '#FFFFFF !important',
                  fontWeight: 700,
                  px: { xs: 2.5, sm: 3.5 },
                  py: 1.2,
                  borderRadius: '9999px',
                  textTransform: 'none',
                  fontSize: { xs: '0.88rem', sm: '0.95rem' },
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    bgcolor: `${TOKENS.accentHover} !important`,
                    background: `${TOKENS.accentHover} !important`,
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                  },
                }}
              >
                Comece agora
              </Button>

              {/* Mobile Hamburger Button */}
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu de navegação"
                sx={{ display: { xs: 'flex', md: 'none' }, color: TOKENS.primary }}
              >
                <MenuIcon size={24} />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Mobile Drawer Navigation */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, p: 3, role: 'presentation' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: TOKENS.primary }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
              <CloseIcon size={24} />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <List>
            {navLinks.map((link, idx) => (
              <ListItem key={idx} disablePadding>
                <ListItemButton
                  component="a"
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box mt={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setMobileMenuOpen(false);
                handleRegisterClick();
              }}
              sx={{
                bgcolor: `${TOKENS.accent} !important`,
                color: '#FFFFFF !important',
                fontWeight: 700,
                py: 1.5,
                borderRadius: 3,
              }}
            >
              Recadastrar Agora
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* 🧩 4.2 Hero Section com Animação de Entrada Suave */}
      <Box
        id="hero"
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${TOKENS.primary} 0%, #172554 60%, #0F172A 100%)`,
          color: '#FFFFFF !important',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          px: 2,
          overflow: 'hidden',
          textAlign: 'center',
          boxShadow: 'inset 0 -15px 30px rgba(0,0,0,0.25)',
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Visual Asset: Circular Badge Flutuante com Microinteração */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 1,
              bgcolor: 'white',
              borderRadius: '50%',
              mb: 3.5,
              boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
              animation: 'floatSlow 4s ease-in-out infinite',
              transition: 'transform 0.35s ease',
              '&:hover': { transform: 'scale(1.08) rotate(3deg)' },
            }}
          >
            <Box
              component="img"
              src="/img/logo-bom-pastor-novo.jpg"
              alt="Logo Movimento Bom Pastor"
              sx={{
                width: { xs: 110, sm: 135, md: 150 },
                height: { xs: 110, sm: 135, md: 150 },
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${TOKENS.primary}`,
              }}
            />
          </Box>

          <Box
            mb={3}
            sx={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: '0.1s',
              opacity: 0,
            }}
          >
            <Chip
              icon={<ShieldCheck size={18} color={TOKENS.accent} />}
              label="Pastoral Familiar — Arquidiocese de Palmas-TO"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.12) !important',
                color: '#ECFDF5 !important',
                fontWeight: 700,
                fontSize: { xs: '0.82rem', sm: '0.92rem' },
                px: 2,
                py: 1,
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backdropFilter: 'blur(8px)',
              }}
            />
          </Box>

          {/* Headline Principal com Animação Suave */}
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Roboto Slab", "Playfair Display", Georgia, serif',
              fontWeight: 800,
              color: '#FFFFFF !important',
              fontSize: { xs: '2.2rem', sm: '3.2rem', md: '3.8rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              mb: 3,
              textShadow: '0 4px 16px rgba(0,0,0,0.5)',
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: '0.2s',
              opacity: 0,
            }}
          >
            Conectados no Amor do Bom Pastor
          </Typography>

          {/* Sub-headline / Copy Introdutório */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              color: '#F1F5F9 !important',
              fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.35rem' },
              lineHeight: 1.75,
              maxWidth: '780px',
              mx: 'auto',
              mb: 5,
              opacity: 0,
              fontFamily: '"Inter", sans-serif',
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: '0.35s',
            }}
          >
            Caro casal, o movimento Bom Pastor tem crescido e abençoado muitas famílias graças ao compromisso de cada um de vocês. Para continuarmos caminhando juntos com organização e cuidado pastoral, precisamos dar um passo simples, mas essencial: o nosso <strong style={{ color: TOKENS.accent, fontWeight: 700 }}>recadastramento</strong>.
          </Typography>

          {/* CTA Primário com Pulsar Suave e Microinteração de Seta */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            justifyContent="center"
            alignItems="center"
            sx={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: '0.5s',
              opacity: 0,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleRegisterClick}
              endIcon={<ArrowRight className="cta-icon" size={22} style={{ color: '#FFFFFF', transition: 'transform 0.3s ease' }} />}
              sx={{
                bgcolor: `${TOKENS.accent} !important`,
                background: `${TOKENS.accent} !important`,
                color: '#FFFFFF !important',
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                px: { xs: 4, sm: 6 },
                py: 2,
                borderRadius: 3,
                textTransform: 'none',
                animation: 'pulseGlow 3s ease-in-out infinite',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  bgcolor: `${TOKENS.accentHover} !important`,
                  background: `${TOKENS.accentHover} !important`,
                  transform: 'scale(1.04)',
                  '& .cta-icon': { transform: 'translateX(6px)' },
                },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              CLIQUE AQUI E FAÇA SEU RECADASTRAMENTO
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 🧩 4.3 Grid de Funcionalidades / Benefícios com Revelação em Scroll */}
      <Container
        id="beneficios"
        ref={benefitsReveal.ref}
        maxWidth="lg"
        sx={{
          mt: -6,
          mb: 10,
          position: 'relative',
          zIndex: 2,
          px: { xs: 2, sm: 3 },
          opacity: benefitsReveal.isVisible ? 1 : 0,
          transform: benefitsReveal.isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 36px, 0)',
          transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5, md: 6 },
            borderRadius: 4,
            bgcolor: 'white',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            border: `1px solid ${TOKENS.border}`,
          }}
        >
          <Box textAlign="center" mb={6}>
            <Typography
              component="h2"
              sx={{
                fontFamily: '"Roboto Slab", "Playfair Display", serif',
                fontWeight: 700,
                color: `${TOKENS.primary} !important`,
                fontSize: { xs: '1.8rem', sm: '2.4rem' },
                mb: 2,
              }}
            >
              Por que atualizar os nossos dados?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: `${TOKENS.textDark} !important`,
                fontSize: { xs: '1rem', sm: '1.15rem' },
                maxWidth: '750px',
                mx: 'auto',
                lineHeight: 1.6,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Ter suas informações atualizadas não é apenas uma questão administrativa, é um ato de cuidado e zelo com a nossa comunidade. Com isso, conseguimos:
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    p: 2.5,
                    bgcolor: benefit.bg,
                    border: `1px solid ${benefit.accent}30`,
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                      bgcolor: '#FFFFFF',
                      '& .card-icon-box': {
                        transform: 'scale(1.15) rotate(6deg)',
                        bgcolor: benefit.accent,
                        color: '#FFFFFF !important',
                        '& svg': { color: '#FFFFFF !important' },
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flexGrow: 1 }}>
                    <Box
                      className="card-icon-box"
                      sx={{
                        display: 'inline-flex',
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        mb: 2.5,
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease',
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: `${TOKENS.primary} !important`,
                        fontSize: '1.15rem',
                        mb: 1.5,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: `${TOKENS.textDark} !important`,
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* 🧩 4.4 Depoimentos / Citação em Destaque com Scroll Reveal */}
      <Container
        id="citacao"
        ref={quoteReveal.ref}
        maxWidth="md"
        sx={{
          mb: 10,
          opacity: quoteReveal.isVisible ? 1 : 0,
          transform: quoteReveal.isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 36px, 0)',
          transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)',
            borderLeft: `6px solid ${TOKENS.accent}`,
            boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, boxShadow 0.3s ease',
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -20,
              bottom: -20,
              opacity: 0.08,
              color: TOKENS.primary,
            }}
          >
            <Quote style={{ width: 180, height: 180 }} />
          </Box>
          <Stack spacing={2} position="relative" zIndex={1}>
            <Quote style={{ width: 38, height: 38, color: TOKENS.accent }} />
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Roboto Slab", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
                color: `${TOKENS.primary} !important`,
                fontSize: { xs: '1.25rem', sm: '1.6rem' },
                lineHeight: 1.6,
              }}
            >
              "Servir não é apenas realizar grandes obras; é cuidar das pequenas responsabilidades com dedicação e fidelidade."
            </Typography>
          </Stack>
        </Paper>
      </Container>

      {/* 🧩 4.5 & 4.6 Chamado ao Serviço & QR Code Card com Scroll Reveal */}
      <Container
        id="chamado"
        ref={ctaReveal.ref}
        maxWidth="lg"
        sx={{
          mb: 10,
          opacity: ctaReveal.isVisible ? 1 : 0,
          transform: ctaReveal.isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 36px, 0)',
          transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ pr: { md: 4 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <ClipboardCheck style={{ color: TOKENS.accent, width: 28, height: 28 }} />
                <Typography
                  variant="overline"
                  sx={{ fontWeight: 700, color: `${TOKENS.accent} !important`, letterSpacing: 1.5, fontSize: '0.9rem' }}
                >
                  Chamado ao Serviço
                </Typography>
              </Stack>

              <Typography
                component="h3"
                sx={{
                  fontFamily: '"Roboto Slab", "Playfair Display", serif',
                  fontWeight: 700,
                  color: `${TOKENS.primary} !important`,
                  fontSize: { xs: '2rem', sm: '2.6rem' },
                  mb: 3,
                }}
              >
                É hora de responder ao chamado!
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: `${TOKENS.textDark} !important`,
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  lineHeight: 1.8,
                  mb: 4,
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Pedimos que dediquem alguns minutos para preencher o formulário. Se mudaram de endereço, telefone ou se têm novas disponividades para servir, este é o momento de nos contar.
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={handleRegisterClick}
                endIcon={<ArrowRight className="cta-bottom-icon" size={22} style={{ color: '#FFFFFF', transition: 'transform 0.3s ease' }} />}
                sx={{
                  bgcolor: `${TOKENS.primary} !important`,
                  background: `${TOKENS.primary} !important`,
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', sm: '1.15rem' },
                  px: { xs: 4, sm: 6 },
                  py: 2,
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(30, 58, 138, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    bgcolor: '#172554 !important',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 28px rgba(30, 58, 138, 0.5)',
                    '& .cta-bottom-icon': { transform: 'translateX(6px)' },
                  },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                CLIQUE AQUI E FAÇA SEU RECADASTRAMENTO
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                bgcolor: 'white',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                border: `2px solid ${TOKENS.border}`,
                position: 'relative',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                },
              }}
            >
              <Chip
                icon={<QrCode size={16} color="#FFFFFF" />}
                label="Acesso Rápido por QR Code"
                size="small"
                sx={{ mb: 3, fontWeight: 700, bgcolor: `${TOKENS.primary} !important`, color: '#FFFFFF !important' }}
              />

              <Typography variant="h6" sx={{ fontWeight: 700, color: `${TOKENS.primary} !important`, mb: 1 }}>
                Escaneie com seu celular
              </Typography>
              <Typography variant="body2" sx={{ color: `${TOKENS.textLight} !important`, mb: 3 }}>
                Aponte a câmera do celular para abrir o formulário diretamente.
              </Typography>

              <Box
                sx={{
                  p: 2,
                  display: 'inline-block',
                  bgcolor: '#F9FAFB',
                  borderRadius: 3,
                  border: '2px dashed #CBD5E1',
                  mb: 3,
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    borderColor: TOKENS.accent,
                  },
                }}
              >
                <Box
                  component="img"
                  src="/img/qrcode-recadastramento.jpg"
                  alt="QR Code Recadastramento Bom Pastor Digital"
                  sx={{
                    maxWidth: { xs: 220, sm: 250 },
                    width: '100%',
                    height: 'auto',
                    borderRadius: 2,
                    display: 'block',
                    mx: 'auto',
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                display="block"
                component="a"
                href="https://bompastordigital.flaviosantiago.com.br/login"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: `${TOKENS.textDark} !important`,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  '&:hover': { textDecoration: 'underline', color: `${TOKENS.accent} !important` },
                }}
              >
                https://bompastordigital.flaviosantiago.com.br/login
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Assinatura Pastoral */}
      <Box sx={{ bgcolor: '#EDF2F7', py: 8, borderTop: `1px solid ${TOKENS.border}` }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: 4,
              bgcolor: 'white',
              border: `1px solid ${TOKENS.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src="/img/logo-bom-pastor-novo.jpg"
                  alt="Pastoral Familiar"
                  sx={{
                    width: 76,
                    height: 76,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    border: `2px solid ${TOKENS.primary}`,
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.08)' },
                  }}
                />
                <Box
                  component="img"
                  src="/img/logo-arquidiocese-palmas.png"
                  alt="Arquidiocese de Palmas"
                  sx={{ height: 60, width: 'auto', transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}
                />
              </Stack>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Roboto Slab", Georgia, serif',
                    fontStyle: 'italic',
                    color: `${TOKENS.accent} !important`,
                    fontWeight: 600,
                    mb: 1.5,
                    fontSize: '1.25rem',
                  }}
                >
                  Com carinho e bênçãos,
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: `${TOKENS.primary} !important`, mb: 0.5 }}>
                  Diretoria Bom Pastor
                </Typography>
                <Typography variant="body1" sx={{ color: `${TOKENS.textDark} !important`, fontWeight: 600, mb: 0.5 }}>
                  Setor de Casos Especiais | Pastoral Familiar
                </Typography>
                <Typography variant="body2" sx={{ color: `${TOKENS.textLight} !important` }}>
                  Arquidiocese de Palmas-TO
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* 🧩 4.7 Rodapé (Footer Multi-Coluna Conforme Blueprint UI/UX) */}
      <Box id="rodape" component="footer" sx={{ bgcolor: TOKENS.primary, color: '#FFFFFF !important', pt: 8, pb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} mb={6}>
            {/* Coluna 1 – Movimento */}
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Box
                  component="img"
                  src="/img/logo-bom-pastor-novo.jpg"
                  alt="Logo Bom Pastor"
                  sx={{ width: 36, height: 36, borderRadius: '50%' }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'white !important', fontSize: '1.1rem' }}>
                  Bom Pastor Digital
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#94A3B8 !important', lineHeight: 1.6, mb: 2 }}>
                Plataforma oficial de recadastramento e integração pastoral para casais e famílias.
              </Typography>
              <Chip
                label={`Versão ${APP_VERSION}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: '0.75rem' }}
              />
            </Grid>

            {/* Coluna 2 – Arquidiocese */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white !important', mb: 2 }}>
                Arquidiocese de Palmas
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: '#CBD5E1 !important' }}>
                  Setor de Casos Especiais
                </Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1 !important' }}>
                  Pastoral Familiar Brasil
                </Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1 !important' }}>
                  Palmas - Tocantins
                </Typography>
              </Stack>
            </Grid>

            {/* Coluna 3 – Links Úteis */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white !important', mb: 2 }}>
                Navegação
              </Typography>
              <Stack spacing={1}>
                {navLinks.map((link, idx) => (
                  <Typography
                    key={idx}
                    component="a"
                    href={link.href}
                    sx={{
                      color: '#CBD5E1 !important',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease',
                      '&:hover': { color: `${TOKENS.accent} !important` },
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            {/* Coluna 4 – Acesso Direto */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white !important', mb: 2 }}>
                Recadastramento
              </Typography>
              <Button
                variant="contained"
                onClick={handleRegisterClick}
                sx={{
                  bgcolor: `${TOKENS.accent} !important`,
                  color: 'white !important',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  mb: 2,
                  transition: 'transform 0.25s ease',
                  '&:hover': { transform: 'scale(1.04)' },
                }}
              >
                Preencher Formulário
              </Button>
              <Typography variant="caption" display="block" sx={{ color: '#94A3B8 !important' }}>
                Conexão segura via Bom Pastor Digital.
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.12)', mb: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="caption" sx={{ color: '#94A3B8 !important' }}>
              © {new Date().getFullYear()} Bom Pastor Digital • Arquidiocese de Palmas-TO. Todos os direitos reservados.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography variant="caption" sx={{ color: '#94A3B8 !important', cursor: 'pointer' }}>
                Privacidade
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8 !important', cursor: 'pointer' }}>
                Termos
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
