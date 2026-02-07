import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Church,
    Event,
    People,
    CheckCircle,
    TrendingUp,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface Stats {
    totalDioceses: number;
    totalEventos: number;
    totalInscricoes: number;
    eventosAbertos: number;
}

interface EventoRecente {
    id: number;
    nome: string;
    data_inicio: string;
    status: string;
    inscricoes_count: number;
    vagas: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        totalDioceses: 0,
        totalEventos: 0,
        totalInscricoes: 0,
        eventosAbertos: 0,
    });
    const [eventosRecentes, setEventosRecentes] = useState<EventoRecente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');

        try {
            // Carregar estatísticas
            const [diocesesRes, eventosRes, inscricoesRes, abertosRes] = await Promise.all([
                supabase.from('dioceses').select('*', { count: 'exact', head: true }),
                supabase.from('eventos').select('*', { count: 'exact', head: true }),
                supabase.from('inscricoes').select('*', { count: 'exact', head: true }),
                supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('status', 'aberto'),
            ]);

            setStats({
                totalDioceses: diocesesRes.count || 0,
                totalEventos: eventosRes.count || 0,
                totalInscricoes: inscricoesRes.count || 0,
                eventosAbertos: abertosRes.count || 0,
            });

            // Carregar eventos recentes com contagem de inscrições
            const { data: eventos } = await supabase
                .from('eventos')
                .select('id, nome, data_inicio, status, vagas')
                .order('data_inicio', { ascending: false })
                .limit(5);

            if (eventos) {
                // Contar inscrições para cada evento
                const eventosComContagem = await Promise.all(
                    eventos.map(async (evento) => {
                        const { count } = await supabase
                            .from('inscricoes')
                            .select('*', { count: 'exact', head: true })
                            .eq('evento_id', evento.id);

                        return {
                            ...evento,
                            inscricoes_count: count || 0,
                        };
                    })
                );

                setEventosRecentes(eventosComContagem);
            }
        } catch (err: any) {
            setError('Erro ao carregar dashboard: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const getStatusChip = (status: string) => {
        const statusMap: Record<string, { label: string; color: any }> = {
            aberto: { label: 'Aberto', color: 'success' },
            em_andamento: { label: 'Em Andamento', color: 'info' },
            concluido: { label: 'Concluído', color: 'default' },
            cancelado: { label: 'Cancelado', color: 'error' },
        };

        const statusInfo = statusMap[status as any] || { label: status, color: 'default' };
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
    };

    const calculateOcupacao = (inscricoes: number, vagas: number) => {
        if (vagas === 0) return 0;
        return Math.round((inscricoes / vagas) * 100);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
                Visão geral do sistema Bom Pastor Digital
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Cards de Estatísticas */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalDioceses}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Dioceses
                                    </Typography>
                                </Box>
                                <Church sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalEventos}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Eventos
                                    </Typography>
                                </Box>
                                <Event sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalInscricoes}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Inscrições
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.eventosAbertos}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Eventos Abertos
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Tabela de Eventos Recentes */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUp color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Eventos Recentes
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nome do Evento</strong></TableCell>
                                <TableCell><strong>Data Início</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Inscrições</strong></TableCell>
                                <TableCell><strong>Ocupação</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventosRecentes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Nenhum evento cadastrado ainda
                                    </TableCell>
                                </TableRow>
                            ) : (
                                eventosRecentes.map((evento) => {
                                    const ocupacao = calculateOcupacao(evento.inscricoes_count, evento.vagas);
                                    return (
                                        <TableRow key={evento.id}>
                                            <TableCell>{evento.nome}</TableCell>
                                            <TableCell>{formatDate(evento.data_inicio)}</TableCell>
                                            <TableCell>{getStatusChip(evento.status)}</TableCell>
                                            <TableCell>
                                                {evento.inscricoes_count} / {evento.vagas}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 100,
                                                            height: 8,
                                                            bgcolor: '#e0e0e0',
                                                            borderRadius: 1,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${Math.min(ocupacao, 100)}%`,
                                                                height: '100%',
                                                                bgcolor: ocupacao >= 90 ? '#f44336' : ocupacao >= 70 ? '#ff9800' : '#4caf50',
                                                                transition: 'width 0.3s',
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {ocupacao}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
