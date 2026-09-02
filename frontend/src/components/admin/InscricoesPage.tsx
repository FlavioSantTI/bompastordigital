import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    CircularProgress,
    Chip,
    MenuItem,
    TextField,
    Divider,
    Tooltip,
    ListSubheader,
} from '@mui/material';
import { Visibility, Delete, FilterList, EditNote, AttachMoney, Add, RocketLaunch, Warning } from '@mui/icons-material';
import EditInscricaoDialog from './EditInscricaoDialog';
import PagamentoDialog from './PagamentoDialog';
import AdminInscricaoDialog from './AdminInscricaoDialog';
import PromoverReservaDialog from './PromoverReservaDialog';
import type { Promovido } from './PromoverReservaDialog';
import { getResumoReservas, getFilaEspera, promoverReservasLote } from '../../services/reservaService';
import type { ResumoReservas } from '../../services/reservaService';
import { supabase } from '../../lib/supabase';

interface Pessoa {
    id: string;
    cpf: string;
    nome: string;
    nascimento: string;
    email?: string | null;
    telefone?: string | null;
}

interface Inscricao {
    id: string;
    evento_id: number | null;
    esposo_id: string | null;
    esposa_id: string | null;
    diocese_id?: number | null;
    status?: string | null;
    tipo?: string | null;
    dados_conjuntos?: any;
    created_at: string;
    evento?: {
        nome: string;
        data_inicio: string;
    } | null;
    esposo?: Pessoa | null;
    esposa?: Pessoa | null;
    diocese?: { nome_completo?: string, nome?: string };
}

interface Evento {
    id: number;
    nome: string;
    inscricao_inicio?: string;
    inscricao_fim?: string;
    realizacao_inicio?: string;
    realizacao_fim?: string;
    publicado?: boolean;
    status_manual?: string | null;
    vagas?: number;
    is_paid?: boolean;
}

export default function InscricoesPage() {
    const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openFullEditDialog, setOpenFullEditDialog] = useState(false);
    const [selectedInscricao, setSelectedInscricao] = useState<Inscricao | null>(null);
    const [editEventoId, setEditEventoId] = useState<number>(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filtroEvento, setFiltroEvento] = useState<number>(-1);

    // Busca e ordenação
    const [termoBusca, setTermoBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [ordenacao, setOrdenacao] = useState('recentes');

    // Estado para o Dialog de Pagamento
    const [openPagamentoDialog, setOpenPagamentoDialog] = useState(false);

    // Estado para o Dialog de Nova Inscrição (Admin)
    const [openAdminDialog, setOpenAdminDialog] = useState(false);

    // Módulo de Lista de Reserva (Frente 1)
    const [resumoReservas, setResumoReservas] = useState<ResumoReservas | null>(null);
    const [openLoteDialog, setOpenLoteDialog] = useState(false);
    const [quantidadePromover, setQuantidadePromover] = useState<number>(0);
    const [previewPromovidos, setPreviewPromovidos] = useState<any[]>([]);
    const [promovidosResult, setPromovidosResult] = useState<Promovido[]>([]);
    const [lotePromoting, setLotePromoting] = useState(false);
    const [isLotePromoted, setIsLotePromoted] = useState(false);
    const [openIndividualAlertaDialog, setOpenIndividualAlertaDialog] = useState(false);
    const [individualTargetToPromote, setIndividualTargetToPromote] = useState<Inscricao | null>(null);
    const [loadingResumo, setLoadingResumo] = useState(false);

    // Estado para o Dialog de Confirmação de Exclusão
    const [deleteTarget, setDeleteTarget] = useState<Inscricao | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    // Lista filtrada e ordenada (calculada em memória)
    const inscricoesFiltradas = inscricoes
        .filter((insc) => {
            const termo = termoBusca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const nome1 = (insc.esposo?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const nome2 = (insc.esposa?.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const cidade = (insc.dados_conjuntos?.cidade || insc.dados_conjuntos?.endereco || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const bateBusca = !termo || nome1.includes(termo) || nome2.includes(termo) || cidade.includes(termo);
            const bateStatus = !filtroStatus || insc.status === filtroStatus;
            return bateBusca && bateStatus;
        })
        .sort((a, b) => {
            if (ordenacao === 'recentes') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (ordenacao === 'antigos') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (ordenacao === 'nome_az') return (a.esposo?.nome || '').localeCompare(b.esposo?.nome || '', 'pt-BR');
            if (ordenacao === 'nome_za') return (b.esposo?.nome || '').localeCompare(a.esposo?.nome || '', 'pt-BR');
            if (ordenacao === 'status') return (a.status || '').localeCompare(b.status || '', 'pt-BR');
            return 0;
        });

    // Mapeia IDs para a posição FIFO
    const filaReservasIds = [...inscricoes]
        .filter(i => i.status === 'reserva')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(i => i.id);

    useEffect(() => {
        fetchEventos();
    }, []);

    useEffect(() => {
        if (filtroEvento !== -1) {
            fetchInscricoes();
            fetchResumoReservas();
        }
    }, [filtroEvento]);

    const fetchResumoReservas = async () => {
        if (filtroEvento <= 0) {
            setResumoReservas(null);
            return;
        }
        setLoadingResumo(true);
        try {
            const res = await getResumoReservas(filtroEvento);
            setResumoReservas(res);
        } catch (err) {
            console.error('Erro ao carregar resumo de reservas:', err);
        } finally {
            setLoadingResumo(false);
        }
    };

    const handleLotePromoClick = async () => {
        if (filtroEvento <= 0 || quantidadePromover <= 0) return;
        setLotePromoting(true);
        try {
            const fila = await getFilaEspera(filtroEvento);
            const preview = fila.slice(0, quantidadePromover);
            setPreviewPromovidos(preview);
            setIsLotePromoted(false);
            setOpenLoteDialog(true);
        } catch (err: any) {
            setError('Erro ao carregar preview da promoção: ' + err.message);
        } finally {
            setLotePromoting(false);
        }
    };

    const handleConfirmLotePromo = async () => {
        if (filtroEvento <= 0 || quantidadePromover <= 0) return;
        setLotePromoting(true);
        try {
            const res = await promoverReservasLote(filtroEvento, quantidadePromover);
            if (res.success) {
                setPromovidosResult(res.promovidos);
                setIsLotePromoted(true);
                fetchInscricoes();
                fetchResumoReservas();
                setSuccess(`${res.total_promovidos} inscrições promovidas com sucesso!`);
            } else {
                setError(res.message || 'Erro ao processar promoção.');
                setOpenLoteDialog(false);
            }
        } catch (err: any) {
            setError('Erro ao executar promoção: ' + err.message);
            setOpenLoteDialog(false);
        } finally {
            setLotePromoting(false);
        }
    };

    const handleConfirmOverride = async () => {
        if (!individualTargetToPromote) return;
        setOpenIndividualAlertaDialog(false);
        const target = individualTargetToPromote;
        setIndividualTargetToPromote(null);
        await handleConfirm(target.id.toString(), 'reserva');
    };

    const handleStatusChipClick = (insc: Inscricao) => {
        if (insc.status === 'reserva') {
            const position = filaReservasIds.indexOf(insc.id) + 1;
            if (position > 1) {
                setIndividualTargetToPromote(insc);
                setOpenIndividualAlertaDialog(true);
                return;
            }
        }
        handleConfirm(insc.id.toString(), insc.status || 'pendente');
    };

    const fetchEventos = async () => {
        const { data } = await supabase
            .from('eventos')
            .select('id, nome, inscricao_inicio, inscricao_fim, realizacao_inicio, realizacao_fim, publicado, status_manual, vagas, is_paid')
            .order('realizacao_inicio', { ascending: false });

        const lista = data || [];
        setEventos(lista);

        // Encontrar o primeiro evento ativo (aberto ou em andamento ou inscrições em breve)
        const now = new Date();
        const ativo = lista.find(e => {
            if (e.status_manual === 'cancelado') return false;
            return e.publicado && new Date(e.realizacao_fim || '') > now;
        });

        if (ativo) {
            setFiltroEvento(ativo.id);
        } else if (lista.length > 0) {
            setFiltroEvento(lista[0].id); // senão o primeiro da lista
        } else {
            setFiltroEvento(0); // senão todos
        }
    };

    const fetchInscricoes = async () => {
        setLoading(true);

        let query = supabase
            .from('inscricoes')
            .select('*')
            .order('created_at', { ascending: false });

        if (filtroEvento > 0) {
            query = query.eq('evento_id', filtroEvento);
        }

        const { data, error } = await query;

        if (error) {
            setError('Erro ao carregar inscrições: ' + error.message);
            setInscricoes([]);
        } else {
            // Buscar informações relacionadas
            const inscricoesCompletas = await Promise.all(
                (data || []).map(async (inscricao) => {
                    // Buscar evento
                    const { data: evento } = await supabase
                        .from('eventos')
                        .select('nome, data_inicio')
                        .eq('id', inscricao.evento_id || 0)
                        .single();

                    // Buscar esposo (se existir)
                    let esposo = null;
                    if (inscricao.esposo_id) {
                        const { data } = await supabase
                            .from('pessoas')
                            .select('*')
                            .eq('id', inscricao.esposo_id)
                            .single();
                        esposo = data;
                    }

                    // Buscar esposa (se existir - comum em casais, ausente em individuais)
                    let esposa = null;
                    if (inscricao.esposa_id) {
                        const { data } = await supabase
                            .from('pessoas')
                            .select('*')
                            .eq('id', inscricao.esposa_id)
                            .single();
                        esposa = data;
                    }

                    // Buscar diocese
                    let diocese = null;
                    if (inscricao.diocese_id) {
                        const { data } = await supabase
                            .from('dioceses')
                            .select('*')
                            .eq('id', inscricao.diocese_id)
                            .single();
                        diocese = data;
                    }

                    return { ...inscricao, evento, esposo, esposa, diocese } as Inscricao;
                })
            );
            setInscricoes(inscricoesCompletas);
        }
        setLoading(false);
    };

    const handleViewDetails = (inscricao: Inscricao) => {
        setSelectedInscricao(inscricao);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedInscricao(null);
    };

    const handleSaveEdit = async () => {
        if (!selectedInscricao || editEventoId === 0) return;

        const { error } = await supabase
            .from('inscricoes')
            .update({ evento_id: editEventoId })
            .eq('id', selectedInscricao.id);

        if (error) {
            setError('Erro ao atualizar: ' + error.message);
        } else {
            setSuccess('Inscrição atualizada com sucesso!');
            setOpenEditDialog(false);
            setSelectedInscricao(null);
            fetchInscricoes();
        }
    };

    const handleConfirm = async (id: string, currentStatus: string) => {
        let newStatus = 'confirmada';
        let updateData: any = {};

        if (currentStatus === 'confirmada') {
            newStatus = 'pendente';
            updateData = { status: newStatus };
        } else if (currentStatus === 'pendente') {
            newStatus = 'confirmada';
            updateData = { status: newStatus };
        } else if (currentStatus === 'reserva') {
            // Promover da reserva respeitando se o evento é pago
            const evt = eventos.find(e => e.id === filtroEvento);
            if (evt?.is_paid) {
                newStatus = 'pendente';
                updateData = { status: newStatus, payment_method_used: 'pix' };
            } else {
                newStatus = 'confirmada';
                updateData = { status: newStatus, payment_method_used: null };
            }
        }

        const { error } = await supabase
            .from('inscricoes')
            .update(updateData)
            .eq('id', id);

        if (error) {
            setError('Erro ao atualizar status: ' + error.message);
        } else {
            setSuccess(`Status alterado para ${newStatus.toUpperCase()} com sucesso!`);
            fetchInscricoes();
            fetchResumoReservas();
        }
    };

    const handleFullEdit = (inscricao: Inscricao) => {
        setSelectedInscricao(inscricao);
        setOpenFullEditDialog(true);
    };

    const handleOpenPagamento = (inscricao: Inscricao) => {
        setSelectedInscricao(inscricao);
        setOpenPagamentoDialog(true);
    };

    const handleDeleteRequest = (inscricao: Inscricao) => {
        setDeleteTarget(inscricao);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setLoadingDelete(true);
        const { error } = await supabase
            .from('inscricoes')
            .delete()
            .eq('id', deleteTarget.id);

        if (error) {
            setError('Erro ao excluir: ' + error.message);
        } else {
            setSuccess('Inscrição excluída com sucesso!');
            fetchInscricoes();
        }
        setLoadingDelete(false);
        setDeleteTarget(null);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '--/--/----';
        // Extract only the date part YYYY-MM-DD
        const datePart = dateStr.substring(0, 10);
        const [year, month, day] = datePart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
    };

    const formatCPF = (cpf: string) => {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const calcularIdade = (nascimento: string) => {
        const hoje = new Date();
        const dataNasc = new Date(nascimento);
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mes = hoje.getMonth() - dataNasc.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }
        return idade;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                    Painel de Inscrições
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        select
                        size="small"
                        label="Filtrar por Evento"
                        value={filtroEvento === -1 ? '' : filtroEvento}
                        onChange={(e) => setFiltroEvento(Number(e.target.value))}
                        sx={{ minWidth: 220 }}
                        InputProps={{
                            startAdornment: <FilterList sx={{ mr: 1 }} />
                        }}
                    >
                        <MenuItem value={0}>Todos os Eventos</MenuItem>
                        {(() => {
                            const now = new Date();
                            const ativos = eventos.filter(e => {
                                if (e.status_manual === 'cancelado') return false;
                                return e.publicado && new Date(e.realizacao_fim || '') > now;
                            });
                            const encerrados = eventos.filter(e => {
                                return e.status_manual === 'cancelado' || !e.publicado || new Date(e.realizacao_fim || '') <= now;
                            });

                            const items = [];
                            if (ativos.length > 0) {
                                items.push(<ListSubheader key="header-ativos">🟢 Eventos Ativos</ListSubheader>);
                                ativos.forEach(evento => {
                                    items.push(
                                        <MenuItem key={evento.id} value={evento.id}>
                                            {evento.nome}
                                        </MenuItem>
                                    );
                                });
                            }
                            if (encerrados.length > 0) {
                                items.push(<ListSubheader key="header-encerrados">📁 Encerrados</ListSubheader>);
                                encerrados.forEach(evento => {
                                    items.push(
                                        <MenuItem key={evento.id} value={evento.id}>
                                            {evento.nome}
                                        </MenuItem>
                                    );
                                });
                            }
                            return items;
                        })()}
                    </TextField>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenAdminDialog(true)}
                        sx={{ whiteSpace: 'nowrap', px: 3 }}
                    >
                        Nova Inscrição
                    </Button>
                </Box>
            </Box>

            {/* Resumo de Inscrições e Vagas do Evento Selecionado */}
            {filtroEvento > 0 && (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                    <Chip
                        label={`✅ ${inscricoes.filter(i => i.status === 'confirmada').length} Confirmadas`}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                        label={`⏳ ${inscricoes.filter(i => i.status === 'pendente').length} Pendentes`}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                        label={`📋 ${inscricoes.filter(i => i.status === 'reserva').length} Reservas`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                    {(() => {
                        const evt = eventos.find(e => e.id === filtroEvento);
                        if (!evt || evt.vagas === undefined) return null;
                        const preenchidas = inscricoes.filter(i => i.status === 'confirmada' || i.status === 'pendente').length;
                        const disponiveis = Math.max(0, evt.vagas - preenchidas);
                        return (
                            <Chip
                                label={`🪑 Vagas: ${preenchidas}/${evt.vagas} (${disponiveis} disponíveis)`}
                                color={disponiveis > 0 ? "primary" : "error"}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                            />
                        );
                    })()}
                    {(() => {
                        const evt = eventos.find(e => e.id === filtroEvento);
                        if (!evt) return null;
                        const dataEventoStr = evt.realizacao_inicio || (evt as any).data_inicio;
                        if (!dataEventoStr) return null;

                        const dataEvento = new Date(dataEventoStr);
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);
                        const targetDate = new Date(dataEvento);
                        targetDate.setHours(0, 0, 0, 0);

                        const diffTime = targetDate.getTime() - hoje.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (isNaN(diffDays)) return null;

                        let texto = '';
                        if (diffDays > 0) {
                            texto = `⏰ Faltam ${diffDays} dia(s) para o Evento`;
                        } else if (diffDays === 0) {
                            texto = `🎉 O Evento é HOJE!`;
                        } else {
                            texto = `🏁 Evento Realizado (${Math.abs(diffDays)} dia(s) atrás)`;
                        }

                        return (
                            <Chip
                                label={texto}
                                color="error"
                                size="small"
                                sx={{ fontWeight: 'bold', bgcolor: '#d32f2f', color: '#FFFFFF' }}
                            />
                        );
                    })()}
                </Box>
            )}

            {/* Painel de Promoção em Lote (Frente 1) */}
            {filtroStatus === 'reserva' && filtroEvento > 0 && inscricoes.filter(i => i.status === 'reserva').length > 0 && (
                <Paper sx={{ p: 2.5, mb: 3, border: `1px solid ${alpha('#9c27b0', 0.2)}`, bgcolor: alpha('#9c27b0', 0.02) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
                                📋 Lista de Espera Ativa
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Existem <strong>{inscricoes.filter(i => i.status === 'reserva').length}</strong> pessoas na fila cronológica.
                                {(() => {
                                    const evt = eventos.find(e => e.id === filtroEvento);
                                    if (!evt || evt.vagas === undefined) return null;
                                    const preenchidas = inscricoes.filter(i => i.status === 'confirmada' || i.status === 'pendente').length;
                                    const disponiveis = Math.max(0, evt.vagas - preenchidas);
                                    return (
                                        <span> Vagas disponíveis no evento: <strong>{disponiveis}</strong>.</span>
                                    );
                                })()}
                            </Typography>
                        </Box>
                        
                        {(() => {
                            const evt = eventos.find(e => e.id === filtroEvento);
                            const preenchidas = inscricoes.filter(i => i.status === 'confirmada' || i.status === 'pendente').length;
                            const disponiveis = evt && evt.vagas !== undefined ? Math.max(0, evt.vagas - preenchidas) : 0;
                            const totalReservas = inscricoes.filter(i => i.status === 'reserva').length;
                            const maxPromover = Math.min(totalReservas, disponiveis);

                            return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                        size="small"
                                        label="Qtd. a promover"
                                        type="number"
                                        value={quantidadePromover === 0 ? '' : quantidadePromover}
                                        onChange={(e) => {
                                            const val = Math.min(maxPromover, Math.max(0, Number(e.target.value)));
                                            setQuantidadePromover(val);
                                        }}
                                        inputProps={{ min: 0, max: maxPromover }}
                                        sx={{ width: 150 }}
                                        disabled={maxPromover === 0 || lotePromoting}
                                        helperText={disponiveis === 0 ? "Sem vagas livres" : `Máximo: ${maxPromover}`}
                                    />
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<RocketLaunch />}
                                        onClick={handleLotePromoClick}
                                        disabled={quantidadePromover <= 0 || quantidadePromover > maxPromover || lotePromoting}
                                    >
                                        {lotePromoting ? 'Carregando...' : 'Promover em Lote'}
                                    </Button>
                                </Box>
                            );
                        })()}
                    </Box>
                </Paper>
            )}

            {/* Barra de busca e ordenação */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nome ou cidade..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 220 }}
                />
                <TextField
                    select
                    size="small"
                    label="Status"
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="pendente">Pendente</MenuItem>
                    <MenuItem value="confirmada">Confirmada</MenuItem>
                    <MenuItem value="reserva">Cadastro de Reserva</MenuItem>
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Ordenar por"
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="recentes">Mais recentes</MenuItem>
                    <MenuItem value="antigos">Mais antigos</MenuItem>
                    <MenuItem value="nome_az">Nome (A → Z)</MenuItem>
                    <MenuItem value="nome_za">Nome (Z → A)</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                </TextField>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {filtroStatus === 'reserva' && <TableCell align="center" width="60"><strong>#</strong></TableCell>}
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Pessoa 1</strong></TableCell>
                                <TableCell><strong>Pessoa 2</strong></TableCell>
                                <TableCell><strong>Contato</strong></TableCell>
                                <TableCell><strong>Localização</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Data Inscr.</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inscricoesFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={filtroStatus === 'reserva' ? 9 : 8} align="center">
                                        {termoBusca || filtroStatus ? 'Nenhum resultado para os filtros aplicados.' : 'Nenhuma inscrição encontrada.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inscricoesFiltradas.map((inscricao) => {
                                    const position = filaReservasIds.indexOf(inscricao.id) + 1;
                                    const isBeingPromotedPreview = filtroStatus === 'reserva' && quantidadePromover > 0 && position <= quantidadePromover;

                                    return (
                                        <TableRow 
                                            key={inscricao.id}
                                            sx={isBeingPromotedPreview ? {
                                                outline: '2px solid #2e7d32',
                                                backgroundColor: alpha('#4caf50', 0.08),
                                                transition: 'all 0.3s'
                                            } : {}}
                                        >
                                            {filtroStatus === 'reserva' && (
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`#${position}`}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 'bold' }}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>
                                            <Chip
                                                label={inscricao.tipo === 'individual' ? 'Individual' : 'Casal'}
                                                color={inscricao.tipo === 'individual' ? 'info' : 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={inscricao.tipo === 'individual' ? 'bold' : 'normal'}>
                                                {inscricao.esposo?.nome || (inscricao.tipo === 'individual' ? 'Não informado' : '-')}
                                            </Typography>
                                            {inscricao.esposo?.cpf && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatCPF(inscricao.esposo.cpf)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {inscricao.tipo === 'individual' ? (
                                                <Typography variant="caption" color="text.secondary">---</Typography>
                                            ) : (
                                                <>
                                                    <Typography variant="body2">
                                                        {inscricao.esposa?.nome || '-'}
                                                    </Typography>
                                                    {inscricao.esposa?.cpf && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatCPF(inscricao.esposa.cpf)}
                                                        </Typography>
                                                    )}
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {inscricao.esposo?.email && (
                                                <Typography variant="body2" fontSize="0.85rem">
                                                    📧 {inscricao.esposo.email}
                                                </Typography>
                                            )}
                                            {inscricao.esposo?.telefone && (
                                                <Typography variant="body2" fontSize="0.85rem">
                                                    📱 {inscricao.esposo.telefone}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 200, maxWidth: 300 }}>
                                            <Typography variant="body2" fontWeight="medium" noWrap title={inscricao.dados_conjuntos?.cidade || inscricao.dados_conjuntos?.endereco || '-'}>
                                                📍 {inscricao.dados_conjuntos?.cidade || inscricao.dados_conjuntos?.endereco || '-'}
                                            </Typography>
                                            <Typography variant="body2" fontSize="0.85rem" noWrap title={inscricao.diocese?.nome_completo || '-'}>
                                                🏛️ {inscricao.diocese?.nome_completo || '-'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }} title={inscricao.dados_conjuntos?.paroquia || '-'}>
                                                ⛪ {inscricao.dados_conjuntos?.paroquia || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={inscricao.status === 'reserva' ? "Clique para PROMOVER para vaga confirmada!" : "Clique para alterar o status"}>
                                                <Chip
                                                    label={
                                                        inscricao.status === 'confirmada' ? 'Confirmada' :
                                                        inscricao.status === 'reserva' ? '📋 Reserva' : 'Pendente'
                                                    }
                                                    color={
                                                        inscricao.status === 'confirmada' ? 'success' :
                                                        inscricao.status === 'reserva' ? 'secondary' : 'warning'
                                                    }
                                                    size="small"
                                                    onClick={() => handleStatusChipClick(inscricao)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        '&:hover': { opacity: 0.8 }
                                                    }}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(inscricao.created_at)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleViewDetails(inscricao)}
                                                title="Ver detalhes"
                                            >
                                                <Visibility />
                                            </IconButton>

                                            <IconButton
                                                color="success"
                                                onClick={() => handleOpenPagamento(inscricao)}
                                                title="Gerenciar Pagamento e Comprovantes"
                                            >
                                                <AttachMoney />
                                            </IconButton>

                                            <IconButton
                                                color="info"
                                                onClick={() => handleFullEdit(inscricao)}
                                                title="Editar todos os dados"
                                            >
                                                <EditNote />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteRequest(inscricao)}
                                                title="Excluir inscrição"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    ⚠️ Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir a inscrição de{' '}
                        <strong>
                            {deleteTarget?.tipo === 'individual'
                                ? deleteTarget?.esposo?.nome
                                : `${deleteTarget?.esposo?.nome || ''} & ${deleteTarget?.esposa?.nome || ''}`}
                        </strong>?
                        Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={loadingDelete}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        disabled={loadingDelete}
                        startIcon={loadingDelete ? <CircularProgress size={16} /> : <Delete />}
                    >
                        {loadingDelete ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Detalhes */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    Detalhes da Inscrição
                </DialogTitle>
                <DialogContent>
                    {selectedInscricao && (
                        <Box sx={{ pt: 2 }}>
                            {/* Evento */}
                            <Typography variant="h6" gutterBottom>
                                📅 Evento
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {selectedInscricao.evento?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Data: {selectedInscricao.evento?.data_inicio && formatDate(selectedInscricao.evento.data_inicio)}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            {/* Dados do Casal */}
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {/* Esposo */}
                                <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                                    <Typography variant="h6" gutterBottom>
                                        👨 Esposo
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Typography><strong>Nome:</strong> {selectedInscricao.esposo?.nome}</Typography>
                                        <Typography><strong>CPF:</strong> {selectedInscricao.esposo?.cpf && formatCPF(selectedInscricao.esposo.cpf)}</Typography>
                                        <Typography><strong>Nascimento:</strong> {selectedInscricao.esposo?.nascimento && formatDate(selectedInscricao.esposo.nascimento)}</Typography>
                                        <Typography><strong>Idade:</strong> {selectedInscricao.esposo?.nascimento && calcularIdade(selectedInscricao.esposo.nascimento)} anos</Typography>
                                        {selectedInscricao.esposo?.email && (
                                            <Typography><strong>Email:</strong> {selectedInscricao.esposo.email}</Typography>
                                        )}
                                        {selectedInscricao.esposo?.telefone && (
                                            <Typography><strong>Telefone:</strong> {selectedInscricao.esposo.telefone}</Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Esposa */}
                                <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                                    <Typography variant="h6" gutterBottom>
                                        👩 Esposa
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Typography><strong>Nome:</strong> {selectedInscricao.esposa?.nome}</Typography>
                                        <Typography><strong>CPF:</strong> {selectedInscricao.esposa?.cpf && formatCPF(selectedInscricao.esposa.cpf)}</Typography>
                                        <Typography><strong>Nascimento:</strong> {selectedInscricao.esposa?.nascimento && formatDate(selectedInscricao.esposa.nascimento)}</Typography>
                                        <Typography><strong>Idade:</strong> {selectedInscricao.esposa?.nascimento && calcularIdade(selectedInscricao.esposa.nascimento)} anos</Typography>
                                        {selectedInscricao.esposa?.email && (
                                            <Typography><strong>Email:</strong> {selectedInscricao.esposa.email}</Typography>
                                        )}
                                        {selectedInscricao.esposa?.telefone && (
                                            <Typography><strong>Telefone:</strong> {selectedInscricao.esposa.telefone}</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="body2" color="text.secondary">
                                Inscrição realizada em: {formatDate(selectedInscricao.created_at)}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Edição */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Editar Inscrição
                </DialogTitle>
                <DialogContent>
                    {selectedInscricao && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                <strong>Casal:</strong> {selectedInscricao.esposo?.nome} e {selectedInscricao.esposa?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                                Inscrito em: {formatDate(selectedInscricao.created_at)}
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                label="Evento"
                                value={editEventoId}
                                onChange={(e) => setEditEventoId(Number(e.target.value))}
                                helperText="Altere o evento desta inscrição se necessário"
                            >
                                {eventos.map((evento) => (
                                    <MenuItem key={evento.id} value={evento.id}>
                                        {evento.nome}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary">
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Edição Completa */}
            <EditInscricaoDialog
                open={openFullEditDialog}
                inscricao={selectedInscricao}
                eventos={eventos}
                onClose={() => {
                    setOpenFullEditDialog(false);
                    setSelectedInscricao(null);
                }}
                onSave={() => {
                    setSuccess('Inscrição atualizada com sucesso!');
                    fetchInscricoes();
                }}
            />

            {/* Dialog de Pagamento */}
            <PagamentoDialog
                open={openPagamentoDialog}
                inscricao={selectedInscricao}
                onClose={() => {
                    setOpenPagamentoDialog(false);
                    setSelectedInscricao(null);
                    fetchInscricoes(); // Atualiza a lista ao fechar para refletir mudanças de status
                }}
                onStatusChange={() => {
                    fetchInscricoes(); // Atualiza a lista em tempo real se o status mudar
                }}
            />

            {/* Dialog de Nova Inscrição Admin */}
            <AdminInscricaoDialog
                open={openAdminDialog}
                onClose={() => setOpenAdminDialog(false)}
                onSave={() => {
                    setSuccess('Inscrição criada com sucesso!');
                    fetchInscricoes();
                }}
            />
            {/* Dialog de Alerta FIFO Individual */}
            <Dialog
                open={openIndividualAlertaDialog}
                onClose={() => setOpenIndividualAlertaDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" /> Atenção: Fila FIFO
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Este participante <strong>não é o próximo da fila</strong>.
                    </Typography>
                    {individualTargetToPromote && (
                        <Typography variant="body2" color="text.secondary">
                            A posição atual dele na Lista de Espera é{' '}
                            <strong>#{filaReservasIds.indexOf(individualTargetToPromote.id) + 1}</strong>.
                        </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Deseja promover mesmo assim, ignorando a ordem cronológica?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenIndividualAlertaDialog(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmOverride} color="warning" variant="contained">
                        Promover mesmo assim
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Promoção em Lote */}
            <PromoverReservaDialog
                open={openLoteDialog}
                onClose={() => {
                    setOpenLoteDialog(false);
                    setQuantidadePromover(0);
                }}
                eventoNome={eventos.find(e => e.id === filtroEvento)?.nome || ''}
                quantidade={quantidadePromover}
                previewList={previewPromovidos}
                isPromoted={isLotePromoted}
                promovidosList={promovidosResult}
                restantesNaFila={resumoReservas?.totalReservas || 0}
                onConfirm={handleConfirmLotePromo}
                loading={lotePromoting}
            />
        </Box>
    );
}
