import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Divider,
    Stack,
    Grid
} from '@mui/material';
import {
    Description,
    Assignment,
    ListAlt,
    PictureAsPdf,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { type DadosExportacao } from '../../services/exportService';
import ReportPreviewDialog from './ReportPreviewDialog';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
}

export default function ReportsPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEvento, setSelectedEvento] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados para o Preview de PDF
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTipo, setPreviewTipo] = useState<'lista' | 'fichas' | 'lista_geral' | 'crachas' | 'lista_presenca_diocese'>('lista');
    const [previewDados, setPreviewDados] = useState<DadosExportacao[]>([]);
    const [previewTitulo, setPreviewTitulo] = useState('');

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('id, nome, data_inicio')
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            setEventos(data || []);
        } catch (err: any) {
            setError('Erro ao carregar eventos: ' + err.message);
        }
    };

    const handleExport = async (tipo: 'lista' | 'fichas' | 'lista_geral' | 'crachas' | 'lista_presenca_diocese') => {
        if (!selectedEvento) {
            setError('Por favor, selecione um evento primeiro.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Buscar inscrições sem joins embedded (evita INNER JOIN que exclui individuais sem esposa_id)
            const { data: rawInscricoes, error: fetchError } = await supabase
                .from('inscricoes')
                .select('*')
                .eq('evento_id', selectedEvento);

            if (fetchError) throw fetchError;

            const inscricoes = rawInscricoes as any[];

            if (!inscricoes || inscricoes.length === 0) {
                setError('Nenhuma inscrição encontrada para este evento.');
                setLoading(false);
                return;
            }

            // Resolver dados relacionados manualmente para suportar casais E individuais
            const pessoaIds = [
                ...inscricoes.map(i => i.esposo_id).filter(Boolean),
                ...inscricoes.map(i => i.esposa_id).filter(Boolean),
            ];
            const dioceseIds = [...new Set(inscricoes.map(i => i.diocese_id).filter(Boolean))];

            // Buscar todas as pessoas referenciadas
            const { data: pessoasData } = pessoaIds.length > 0
                ? await supabase.from('pessoas').select('*').in('id', pessoaIds)
                : { data: [] };
            const pessoasMap: Record<string, any> = {};
            (pessoasData || []).forEach((p: any) => { pessoasMap[p.id] = p; });

            // Buscar todas as dioceses referenciadas
            const { data: diocesesData } = dioceseIds.length > 0
                ? await supabase.from('dioceses').select('id, nome_completo').in('id', dioceseIds)
                : { data: [] };
            const diocesesMap: Record<number, any> = {};
            (diocesesData || []).forEach((d: any) => { diocesesMap[d.id] = d; });

            const infoEvento = eventos.find(e => e.id === selectedEvento);
            const nomeEvento = infoEvento?.nome || 'Evento';

            let dadosExportacao: DadosExportacao[] = inscricoes.map(insc => {
                const dc = insc.dados_conjuntos || {};
                const esposo = insc.esposo_id ? pessoasMap[insc.esposo_id] : null;
                const esposa = insc.esposa_id ? pessoasMap[insc.esposa_id] : null;
                const diocese = insc.diocese_id ? diocesesMap[insc.diocese_id] : null;

                let cidade = 'N/A';
                if (dc.cidade) {
                    cidade = dc.cidade;
                } else if (dc.endereco) {
                    const match = dc.endereco.match(/,\s*([^,-]+)-[A-Z]{2}/) || 
                                  dc.endereco.match(/,\s*([^,-]+),/);
                    if (match) cidade = match[1].trim();
                }

                if (cidade === 'N/A' && diocese?.nome_completo) {
                    cidade = String(diocese.nome_completo).split('-')[1]?.trim() || String(diocese.nome_completo);
                }

                return {
                    id: insc.id,
                    tipo: (insc.tipo as 'casal' | 'individual') || (esposa ? 'casal' : 'individual'),
                    status: insc.status || 'pendente',
                    created_at: insc.created_at,
                    data_inscricao: insc.created_at,
                    esposo: {
                        nome: esposo?.nome || 'N/A',
                        cpf: esposo?.cpf,
                        email: esposo?.email || undefined,
                        telefone: esposo?.telefone || undefined,
                        nascimento: esposo?.nascimento
                    },
                    esposa: esposa ? {
                        nome: esposa.nome || 'N/A',
                        cpf: esposa.cpf,
                        email: esposa.email || undefined,
                        telefone: esposa.telefone || undefined,
                        nascimento: esposa.nascimento
                    } : undefined,
                    endereco: {
                        cidade: cidade,
                        completo: dc.endereco || 'N/A'
                    },
                    pastoral: {
                        diocese: diocese?.nome_completo || 'N/A',
                        paroquia: dc.paroquia || 'N/A',
                        paroco: dc.paroco,
                        membro_pasfam: dc.membro_pasfam,
                        nova_uniao: dc.nova_uniao
                    },
                    logistica: {
                        necessita_hospedagem: dc.necessita_hospedagem,
                        restricoes_alimentares: dc.restricoes_alimentares
                    },
                    observacoes: insc.observacoes || ''
                };
            });

            // Ordenação padrão para relatórios
            dadosExportacao.sort((a, b) => {
                const cmpDiocese = a.pastoral.diocese.localeCompare(b.pastoral.diocese);
                if (cmpDiocese !== 0) return cmpDiocese;
                const cmpParoquia = a.pastoral.paroquia.localeCompare(b.pastoral.paroquia);
                if (cmpParoquia !== 0) return cmpParoquia;
                return a.esposo.nome.localeCompare(b.esposo.nome);
            });

            setPreviewDados(dadosExportacao);
            setPreviewTitulo(nomeEvento);
            setPreviewTipo(tipo);
            setPreviewOpen(true);

        } catch (err: any) {
            console.error(err);
            setError('Erro ao preparar exportação: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" color="primary" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 0.5 }}>
                Relatórios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Gere crachás, listas de presença e fichas de inscrição em PDF.
            </Typography>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Grid container spacing={3}>
                    {/* Event Select */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="evento-select-label">Selecione o Evento</InputLabel>
                            <Select
                                labelId="evento-select-label"
                                value={selectedEvento}
                                label="Selecione o Evento"
                                onChange={(e) => setSelectedEvento(e.target.value as number)}
                            >
                                <MenuItem value=""><em>-- Escolha um evento --</em></MenuItem>
                                {eventos.map((ev) => (
                                    <MenuItem key={ev.id} value={ev.id}>
                                        {ev.nome} — {ev.data_inicio.split('-').reverse().join('/')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    {error && <Grid size={12}><Alert severity="error" sx={{ py: 0 }}>{error}</Alert></Grid>}

                    <Grid size={12}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <PictureAsPdf fontSize="small" sx={{ color: '#d32f2f' }} />
                            <Typography variant="subtitle1" fontWeight="bold">Relatórios PDF</Typography>
                        </Stack>
                        
                        <Grid container spacing={2}>
                            {/* Crachás */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fbf8ff' }}>
                                    <CardActionArea onClick={() => handleExport('crachas')} disabled={loading}>
                                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                            <BadgeIcon sx={{ fontSize: 32, mb: 0.5, color: '#9C27B0' }} />
                                            <Typography variant="body2" fontWeight="bold">Crachás</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                A4 (2 por folha)
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                            {/* Lista Geral */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardActionArea onClick={() => handleExport('lista_geral')} disabled={loading}>
                                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                            <Assignment sx={{ fontSize: 32, mb: 0.5, color: '#1976d2' }} />
                                            <Typography variant="body2" fontWeight="bold">Lista Geral</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Por Diocese
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                             {/* Lista de Check-in */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardActionArea onClick={() => handleExport('lista')} disabled={loading}>
                                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                            <ListAlt sx={{ fontSize: 32, mb: 0.5, color: '#2e7d32' }} />
                                            <Typography variant="body2" fontWeight="bold">Lista Check-in</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Geral Alfabética
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                            {/* Lista de Presença por Diocese (NOVO) */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #1e3a5f' }}>
                                    <CardActionArea onClick={() => handleExport('lista_presenca_diocese')} disabled={loading}>
                                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                            <PictureAsPdf sx={{ fontSize: 32, mb: 0.5, color: '#1e3a5f' }} />
                                            <Typography variant="body2" fontWeight="bold" color="primary">Lista de Presença</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Por Diocese
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>

                            {/* Fichas */}
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                    <CardActionArea onClick={() => handleExport('fichas')} disabled={loading}>
                                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                            <Description sx={{ fontSize: 32, mb: 0.5, color: '#ed6c02' }} />
                                            <Typography variant="body2" fontWeight="bold">Fichas Insc.</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Completo
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {loading && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Preparando documentos...</Typography>
                </Box>
            )}

            <ReportPreviewDialog
                open={previewOpen}
                tipo={previewTipo}
                dados={previewDados}
                tituloEvento={previewTitulo}
                onClose={() => setPreviewOpen(false)}
            />
        </Box>
    );
}
