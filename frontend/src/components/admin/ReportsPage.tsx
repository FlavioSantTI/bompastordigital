import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    TextField,
    Button,
    Card,
    CardContent,
    CardActions,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import { PictureAsPdf, TableView, ListAlt, CloudDownload } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { exportService } from '../../services/exportService';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
}

export default function ReportsPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEvento, setSelectedEvento] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        const { data } = await supabase
            .from('eventos')
            .select('id, nome, data_inicio')
            .order('data_inicio', { ascending: false });
        setEventos(data || []);
    };

    const handleExport = async (tipo: 'excel' | 'fichas_pdf' | 'lista_pdf') => {
        if (selectedEvento === 0) {
            setError('Por favor, selecione um evento primeiro.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Buscar dados completos do evento
            const { data: inscricoes, error: fetchError } = await supabase
                .from('inscricoes')
                .select(`
                    *,
                    evento:eventos(nome),
                    esposo:pessoas!esposo_id(*),
                    esposa:pessoas!esposa_id(*)
                `)
                .eq('evento_id', selectedEvento);

            if (fetchError) throw fetchError;

            if (!inscricoes || inscricoes.length === 0) {
                setError('Nenhuma inscrição encontrada para este evento.');
                setLoading(false);
                return;
            }

            // 2. Mapear para o formato do serviço
            const dadosExportacao = inscricoes.map((insc: any) => ({
                evento: insc.evento?.nome,
                esposo: {
                    nome: insc.esposo?.nome,
                    cpf: insc.esposo?.cpf,
                    nascimento: insc.esposo?.nascimento,
                    email: insc.esposo?.email,
                    telefone: insc.esposo?.telefone,
                },
                esposa: {
                    nome: insc.esposa?.nome,
                    cpf: insc.esposa?.cpf,
                    nascimento: insc.esposa?.nascimento,
                    email: insc.esposa?.email,
                    telefone: insc.esposa?.telefone,
                },
                endereco: {
                    cidade: insc.dados_conjuntos?.endereco?.cidade || '-',
                    bairro: insc.dados_conjuntos?.endereco?.bairro || '-',
                    rua: insc.dados_conjuntos?.endereco?.rua || '-',
                    numero: insc.dados_conjuntos?.endereco?.numero || '-',
                },
                casamento: {
                    data: insc.dados_conjuntos?.casamento?.data,
                    igreja: insc.dados_conjuntos?.casamento?.igreja,
                    paroquia: insc.dados_conjuntos?.casamento?.paroquia,
                },
                status: insc.status || 'pendente',
                data_inscricao: insc.created_at
            }));

            const nomeEvento = eventos.find(e => e.id === selectedEvento)?.nome || 'Evento';

            // 3. Chamar serviço de exportação
            if (tipo === 'excel') {
                exportService.exportarExcel(dadosExportacao, `Relatorio_${nomeEvento}`);
                setSuccess('Planilha Excel gerada com sucesso!');
            } else if (tipo === 'fichas_pdf') {
                exportService.exportarFichasPDF(dadosExportacao, nomeEvento);
                setSuccess('PDF de Fichas gerado com sucesso!');
            } else if (tipo === 'lista_pdf') {
                exportService.exportarListaPresencaPDF(dadosExportacao, nomeEvento);
                setSuccess('Lista de Presença gerada com sucesso!');
            }

        } catch (err: any) {
            console.error(err);
            setError('Erro ao gerar relatório: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Relatórios & Fichas
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Selecione um evento para gerar listagens e fichas de inscrição.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Paper sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <TextField
                            select
                            fullWidth
                            label="Selecione o Evento"
                            value={selectedEvento}
                            onChange={(e) => setSelectedEvento(Number(e.target.value))}
                        >
                            <MenuItem value={0} disabled>Selecione...</MenuItem>
                            {eventos.map((evento) => (
                                <MenuItem key={evento.id} value={evento.id}>
                                    {evento.nome} ({new Date(evento.data_inicio).toLocaleDateString()})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* Cartão Excel */}
                <Box sx={{ flex: '1 1 300px' }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TableView color="success" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Planilha Geral</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Exporta todos os dados (inclusive endereço completo) para Excel (.xlsx). Ideal para conferência da equipe.
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                    bgcolor: '#2e7d32',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#1b5e20' },
                                    '&.Mui-disabled': { bgcolor: '#a5d6a7', color: 'white' }
                                }}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
                                onClick={() => handleExport('excel')}
                                disabled={loading || selectedEvento === 0}
                            >
                                Baixar Excel
                            </Button>
                        </CardActions>
                    </Card>
                </Box>

                {/* Cartão Fichas PDF */}
                <Box sx={{ flex: '1 1 300px' }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <ListAlt color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Fichas de Inscrição</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Gera um PDF com uma página por casal, contendo todos os dados detalhados. Pronto para imprimir.
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                    bgcolor: '#1E3A5F',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#152a45' },
                                    '&.Mui-disabled': { bgcolor: '#7a9cc6', color: 'white' }
                                }}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                                onClick={() => handleExport('fichas_pdf')}
                                disabled={loading || selectedEvento === 0}
                            >
                                Baixar Fichas
                            </Button>
                        </CardActions>
                    </Card>
                </Box>

                {/* Cartão Lista Presença */}
                <Box sx={{ flex: '1 1 300px' }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PictureAsPdf color="warning" sx={{ fontSize: 40, mr: 2 }} />
                                <Typography variant="h6">Lista de Presença</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Lista simples (Tabela) apenas com nomes e telefones para check-in rápido na entrada.
                            </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                    bgcolor: '#ed6c02',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#c55a02' },
                                    '&.Mui-disabled': { bgcolor: '#ffb74d', color: 'white' }
                                }}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                                onClick={() => handleExport('lista_pdf')}
                                disabled={loading || selectedEvento === 0}
                            >
                                Baixar Lista Simples
                            </Button>
                        </CardActions>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}
