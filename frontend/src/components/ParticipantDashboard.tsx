import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Container, Alert, Button, Paper, IconButton, Tooltip } from '@mui/material';
import { Logout, Home, Refresh } from '@mui/icons-material';
import RegistrationStepper from './RegistrationStepper';
import RegistrationSummary from './RegistrationSummary';
import MinhaEquipeSection from './MinhaEquipeSection';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ParticipantDashboard() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [inscricoes, setInscricoes] = useState<any[]>([]); // Mudou para array
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false); // Controle para mostrar form mesmo com inscrições

    useEffect(() => {
        async function checkRegistration() {
            if (!user || !user.email) return;

            try {
                console.log('[Dashboard] Buscando inscrições para user:', user.id, 'e email:', user.email);
                
                // 1. Busca IDs de pessoa associados ao email do usuário (case-insensitive)
                const { data: pessoas, error: pessoasError } = await supabase
                    .from('pessoas')
                    .select('id')
                    .ilike('email', user.email.trim());

                if (pessoasError) {
                    console.error('[Dashboard] Erro ao buscar pessoa por email:', pessoasError);
                }

                const pessoaIds = pessoas?.map(p => p.id) || [];
                console.log('[Dashboard] IDs de pessoas resolvidos:', pessoaIds);

                // 2. Busca TODAS as inscrições do usuário (por user_id ou por vínculo de cônjuge)
                let query = supabase
                    .from('inscricoes')
                    .select(`
                        *,
                        esposo:esposo_id (*),
                        esposa:esposa_id (*),
                        eventos:evento_id (*),
                        dioceses:diocese_id (*)
                    `);

                if (pessoaIds.length > 0) {
                    query = query.or(`user_id.eq.${user.id},esposo_id.in.(${pessoaIds.join(',')}),esposa_id.in.(${pessoaIds.join(',')})`);
                } else {
                    query = query.eq('user_id', user.id);
                }

                const { data, error } = await query
                    .order('created_at', { ascending: false }); // Mais recentes primeiro

                if (error) {
                    console.error('[Dashboard] Erro na query de inscrições:', error.code, error.message);
                    
                    // Se for erro de autenticação (JWT expirado), não mostrar erro genérico
                    // O AuthContext vai lidar com isso
                    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
                        console.warn('[Dashboard] Token JWT expirado ou inválido. Aguardando refresh...');
                        setError('Sua sessão expirou. Aguarde ou faça login novamente.');
                        setLoading(false);
                        return;
                    }
                    
                    throw error;
                }

                console.log('[Dashboard] Inscrições encontradas:', data?.length || 0);
                if (data) {
                    setInscricoes(data);
                }
            } catch (err: any) {
                console.error('[Dashboard] Erro ao buscar inscrições:', err);
                setError('Falha ao carregar seus dados. Tente recarregar a página.');
            } finally {
                setLoading(false);
            }
        }

        checkRegistration();
    }, [user]);

    const handleEdit = (id: number) => {
        // setIsEditing(true); 
        // Implementar edição futura
        alert('Edição em breve para inscrição #' + id);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => window.location.reload()}>
                    Tentar Novamente
                </Button>
            </Container>
        );
    }

    // MODO FORMULÁRIO (Quando usuário clica em "Nova Inscrição")
    if (showForm) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Button
                        variant="text"
                        onClick={() => setShowForm(false)}
                        sx={{ mb: 2, alignSelf: 'flex-start' }}
                    >
                        ← Voltar
                    </Button>
                    <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
                        Nova Inscrição
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Preencha os dados abaixo para garantir sua vaga.
                    </Typography>
                </Box>

                <RegistrationStepper 
                    onSuccess={() => window.location.reload()} 
                    onCancel={() => setShowForm(false)}
                />
            </Container>
        );
    }

    // MODO BOAS-VINDAS (Usuário sem inscrições)
    if (inscricoes.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 5,
                        textAlign: 'center',
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Box
                        sx={{
                            width: 80, height: 80,
                            bgcolor: 'primary.50',
                            color: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2
                        }}
                    >
                        <Typography variant="h3">👋</Typography>
                    </Box>

                    <Typography variant="h4" fontWeight="bold" color="primary.dark">
                        Bem-vindo(a)!
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Você está na área do participante do <strong>Bom Pastor Digital</strong>.
                        Aqui você poderá gerenciar suas inscrições em encontros e retiros.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => setShowForm(true)}
                        sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                    >
                        Fazer Minha Primeira Inscrição
                    </Button>
                </Paper>
            </Container>
        );
    }

    // MODO LISTA (Minhas Inscrições existenes)
    return (
        <Container maxWidth="md">
            {/* Header Simples para Participante */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4, 
                pb: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider' 
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home color="primary" />
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Bom Pastor Digital
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Recarregar">
                        <IconButton onClick={() => window.location.reload()} size="small">
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Logout />} 
                        onClick={() => signOut()}
                    >
                        Sair
                    </Button>
                </Box>
            </Box>

            <Box sx={{ 
                mb: 4, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 2 
            }}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
                        Painel do Participante
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Bem-vindo, <strong>{user?.user_metadata?.nome || user?.email}</strong>. Gerencie sua participação no evento abaixo.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    onClick={() => setShowForm(true)}
                    sx={{ fontWeight: 'bold', borderRadius: 2 }}
                >
                    Nova Inscrição
                </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Refresh fontSize="small" /> Dados da Minha Inscrição
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inscricoes.map((inscricao) => (
                    <RegistrationSummary
                        key={inscricao.id}
                        inscricao={inscricao}
                        onEdit={() => handleEdit(inscricao.id)}
                        onBack={() => {
                            setShowForm(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                ))}
            </Box>

            {/* Seção Minhas Equipes */}
            {user?.email && <MinhaEquipeSection userEmail={user.email} />}
        </Container>
    );
}
