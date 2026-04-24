import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    Paper,
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TablePagination,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import { QrCode, ArrowBack, History, GridView } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function PresencaPublica() {
    const { eventoId } = useParams<{ eventoId: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dados, setDados] = useState<any[]>([]);
    const [evento, setEvento] = useState<any>(null);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [tabIndex, setTabIndex] = useState(0);
    const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);

    useEffect(() => {
        if (eventoId) {
            fetchData();
        }
    }, [eventoId]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Buscar info do evento
            const { data: eventData, error: eventError } = await supabase
                .from('eventos')
                .select('*')
                .eq('id', eventoId)
                .single();

            if (eventError) throw eventError;
            setEvento(eventData);

            // 2. Buscar dados da view
            const { data, error: fetchError } = await supabase
                .from('view_presenca_gerencial')
                .select('*')
                .eq('evento_id', eventoId)
                .order('hora_chegada', { ascending: false });

            if (fetchError) throw fetchError;
            const records = data || [];
            setDados(records);

            // Extrair datas únicas
            const dates = Array.from(new Set(records.map((d: any) => d.data_evento.split('T')[0]))).sort() as string[];
            setDatasDisponiveis(dates);

        } catch (err: any) {
            console.error('Erro ao buscar dados de presença:', err);
            setError('Não foi possível carregar o relatório de presença. Verifique o link ou tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: '#f8f9fa' }}>
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary">Carregando relatório de presença...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fcf9f9', py: { xs: 2, md: 4 } }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, mb: 3, bgcolor: '#FF921C', color: '#fff' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box 
                                component="img" 
                                src="/img/logo.jpg" 
                                alt="Logo Bom Pastor" 
                                sx={{ 
                                    height: 50, 
                                    borderRadius: '50%', 
                                    border: '2px solid rgba(255,255,255,0.2)' 
                                }} 
                            />
                            <Box>
                                <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8, fontWeight: 'bold' }}>
                                    BOM PASTOR DIGITAL • STATUS EM TEMPO REAL
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', mb: 0.5 }}>
                                    Relatório de Presença
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    {evento?.nome} — {evento?.data_inicio?.split('-').reverse().join('/')}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip 
                            icon={<History sx={{ color: '#fff !important' }} />} 
                            label={`Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'medium', border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                    </Stack>
                </Paper>

                {/* Seletor de Datas */}
                {datasDisponiveis.length > 1 && (
                    <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid #eee' }}>
                        <Tabs 
                            value={tabIndex} 
                            onChange={(_, v) => { setTabIndex(v); setPage(0); }}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                bgcolor: '#fff',
                                '& .MuiTab-root': { fontWeight: 'bold', minHeight: 60 },
                                '& .Mui-selected': { color: '#FF921C !important' },
                                '& .MuiTabs-indicator': { bgcolor: '#FF921C' }
                            }}
                        >
                            <Tab label="Todos os Dias" />
                            {datasDisponiveis.map((data) => (
                                <Tab key={data} label={new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                            ))}
                        </Tabs>
                    </Paper>
                )}

                {error ? (
                    <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{error}</Alert>
                ) : (
                    <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                            <Table stickyHeader aria-label="tabela de presença">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Participante</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Turno</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Data</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Chegada</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Diocese</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 800, color: '#FF921C', fontSize: '0.85rem', textTransform: 'uppercase' }}>Cidade</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(() => {
                                        const dadosFiltrados = tabIndex === 0 
                                            ? dados 
                                            : dados.filter(d => d.data_evento.split('T')[0] === datasDisponiveis[tabIndex - 1]);

                                        if (dadosFiltrados.length === 0) {
                                            return (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                        <Typography color="text.secondary">Nenhum registro encontrado para este filtro.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }

                                        return dadosFiltrados
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row, idx) => (
                                                <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>{row.participante}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={row.turno} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontWeight: 'bold',
                                                                bgcolor: row.turno === 'MANHA' ? '#e3f2fd' : row.turno === 'TARDE' ? '#fff3e0' : '#f3e5f5',
                                                                color: row.turno === 'MANHA' ? '#1565c0' : row.turno === 'TARDE' ? '#e65100' : '#7b1fa2'
                                                            }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>{new Date(row.data_evento).toLocaleDateString('pt-BR')}</TableCell>
                                                    <TableCell sx={{ color: '#2e7d32', fontWeight: 'medium' }}>
                                                        {row.hora_chegada ? new Date(row.hora_chegada).toLocaleTimeString('pt-BR') : '-'}
                                                    </TableCell>
                                                    <TableCell color="text.secondary">{row.diocese}</TableCell>
                                                    <TableCell color="text.secondary">{row.cidade_inscricao}</TableCell>
                                                </TableRow>
                                            ));
                                    })()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[15, 30, 50]}
                            component="div"
                            count={tabIndex === 0 
                                ? dados.length 
                                : dados.filter(d => d.data_evento.split('T')[0] === datasDisponiveis[tabIndex - 1]).length
                            }
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Linhas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            sx={{ borderTop: '1px solid #e0e0e0', bgcolor: '#fff' }}
                        />
                    </Paper>
                )}

                <Box sx={{ mt: 4, textAlign: 'center', pb: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        © 2026 Bom Pastor Digital • Sistema de Gestão Pastoral
                    </Typography>
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
