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
    Event as EventIcon,
    People,
    Group,
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
    status: string | null;
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
    const [ultimasInscricoes, setUltimasInscricoes] = useState<any[]>([]);
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

            // Carregar últimas 5 inscrições detalhadas
            const { data: inscricoesRecentes } = await supabase
                .from('inscricoes')
                .select(`
                    id, 
                    created_at, 
                    status,
                    esposo_id,
                    esposa_id,
                    evento_id
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (inscricoesRecentes) {
                // Fetch de dependências (Pessoas e Eventos) para o grid final
                const inscricoesDetalhes = await Promise.all(
                    inscricoesRecentes.map(async (insc) => {
                        const { data: esposa } = await supabase.from('pessoas').select('nome').eq('id', insc.esposa_id?.toString() || '').single();
                        const { data: esposo } = await supabase.from('pessoas').select('nome').eq('id', insc.esposo_id?.toString() || '').single();
                        const { data: evento } = await supabase.from('eventos').select('nome').eq('id', insc.evento_id ? Number(insc.evento_id) : 0).single();

                        return {
                            ...insc,
                            esposo,
                            esposa,
                            evento
                        };
                    })
                );
                setUltimasInscricoes(inscricoesDetalhes);
            }

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

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
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
                                <EventIcon sx={{ fontSize: 48, opacity: 0.3 }} />
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
                                            <TableCell>{getStatusChip(evento.status || 'aberto')}</TableCell>
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
            <Box mt={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group /> Últimas Inscrições
                </Typography>
                <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Casal</TableCell>
                                <TableCell>Evento</TableCell>
                                <TableCell>Data/Hora</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ultimasInscricoes?.map((inscricao: any) => (
                                <TableRow key={inscricao.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {inscricao.esposo?.nome?.split(' ')[0] || 'N/A'} & {inscricao.esposa?.nome?.split(' ')[0] || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{inscricao.evento?.nome || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(inscricao.created_at)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={inscricao.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                                            color={inscricao.status === 'confirmada' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!ultimasInscricoes || ultimasInscricoes.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">Nenhuma inscrição recente</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}
