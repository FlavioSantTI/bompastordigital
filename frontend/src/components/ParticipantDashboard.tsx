import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Container, Alert, Button, Paper } from '@mui/material';
import RegistrationStepper from './RegistrationStepper';
import RegistrationSummary from './RegistrationSummary';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ParticipantDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [inscricoes, setInscricoes] = useState<any[]>([]); // Mudou para array
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false); // Controle para mostrar form mesmo com inscrições

    useEffect(() => {
        async function checkRegistration() {
            if (!user) return;

            try {
                // Busca TODAS as inscrições do usuário
                const { data, error } = await supabase
                    .from('inscricoes')
                    .select(`
                        *,
                        esposo:esposo_id (*),
                        esposa:esposa_id (*),
                        eventos:evento_id (*),
                        dioceses:diocese_id (*)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }); // Mais recentes primeiro

                if (error) throw error;

                if (data) {
                    setInscricoes(data);
                }
            } catch (err: any) {
                console.error('Erro ao buscar inscrições:', err);
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

                <RegistrationStepper />
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
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                        Minhas Inscrições
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Você possui {inscricoes.length} inscrição(ões) ativa(s).
                    </Typography>
                </Box>
                <Button variant="contained" onClick={() => setShowForm(true)}>
                    + Nova Inscrição
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inscricoes.map((inscricao) => (
                    <RegistrationSummary
                        key={inscricao.id}
                        inscricao={inscricao}
                        onEdit={() => handleEdit(inscricao.id)}
                    />
                ))}
            </Box>
        </Container>
    );
}
