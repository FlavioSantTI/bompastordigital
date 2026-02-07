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
} from '@mui/material';
import { Visibility, Delete, FilterList, EditNote, AttachMoney } from '@mui/icons-material';
import EditInscricaoDialog from './EditInscricaoDialog';
import PagamentoDialog from './PagamentoDialog';
import { supabase } from '../../lib/supabase';

interface Pessoa {
    id: string;
    cpf: string;
    nome: string;
    nascimento: string;
    email?: string;
    telefone?: string;
}

interface Inscricao {
    id: number;
    evento_id: number;
    esposo_id: string;
    esposa_id: string;
    status?: string;
    dados_conjuntos?: any;
    created_at: string;
    evento?: {
        nome: string;
        data_inicio: string;
    };
    esposo?: Pessoa;
    esposa?: Pessoa;
}

interface Evento {
    id: number;
    nome: string;
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
    const [filtroEvento, setFiltroEvento] = useState<number>(0);

    // Estado para o Dialog de Pagamento
    const [openPagamentoDialog, setOpenPagamentoDialog] = useState(false);

    useEffect(() => {
        fetchEventos();
        fetchInscricoes();
    }, []);

    useEffect(() => {
        fetchInscricoes();
    }, [filtroEvento]);

    const fetchEventos = async () => {
        const { data } = await supabase
            .from('eventos')
            .select('id, nome')
            .order('data_inicio', { ascending: false });

        setEventos(data || []);
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
                        .eq('id', inscricao.evento_id)
                        .single();

                    // Buscar esposo
                    const { data: esposo } = await supabase
                        .from('pessoas')
                        .select('*')
                        .eq('id', inscricao.esposo_id)
                        .single();

                    // Buscar esposa
                    const { data: esposa } = await supabase
                        .from('pessoas')
                        .select('*')
                        .eq('id', inscricao.esposa_id)
                        .single();

                    return { ...inscricao, evento, esposo, esposa };
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

    const handleConfirm = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'confirmada' ? 'pendente' : 'confirmada';

        const { error } = await supabase
            .from('inscricoes')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            setError('Erro ao atualizar status: ' + error.message);
        } else {
            setSuccess(`Inscrição ${newStatus === 'confirmada' ? 'confirmada' : 'desmarcada'} com sucesso!`);
            fetchInscricoes();
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

    const handleDelete = async (id: number, nomeEsposo: string) => {
        if (!confirm(`Tem certeza que deseja excluir a inscrição do casal ${nomeEsposo}?`)) {
            return;
        }

        const { error } = await supabase
            .from('inscricoes')
            .delete()
            .eq('id', id);

        if (error) {
            setError('Erro ao excluir: ' + error.message);
        } else {
            setSuccess('Inscrição excluída com sucesso!');
            fetchInscricoes();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Inscrições de Casais
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        select
                        size="small"
                        label="Filtrar por Evento"
                        value={filtroEvento}
                        onChange={(e) => setFiltroEvento(Number(e.target.value))}
                        sx={{ minWidth: 250 }}
                        InputProps={{
                            startAdornment: <FilterList sx={{ mr: 1 }} />
                        }}
                    >
                        <MenuItem value={0}>Todos os Eventos</MenuItem>
                        {eventos.map((evento) => (
                            <MenuItem key={evento.id} value={evento.id}>
                                {evento.nome}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Chip
                        label={`${inscricoes.length} inscrições`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
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
                                <TableCell><strong>Evento</strong></TableCell>
                                <TableCell><strong>Esposo</strong></TableCell>
                                <TableCell><strong>Esposa</strong></TableCell>
                                <TableCell><strong>Contato</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Data Inscrição</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {inscricoes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        Nenhuma inscrição encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inscricoes.map((inscricao) => (
                                    <TableRow key={inscricao.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {inscricao.evento?.nome || '-'}
                                            </Typography>
                                            {inscricao.evento?.data_inicio && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDate(inscricao.evento.data_inicio)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {inscricao.esposo?.nome || '-'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {inscricao.esposo?.cpf ? formatCPF(inscricao.esposo.cpf) : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {inscricao.esposa?.nome || '-'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {inscricao.esposa?.cpf ? formatCPF(inscricao.esposa.cpf) : '-'}
                                            </Typography>
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
                                        <TableCell>
                                            <Tooltip title="Clique para alterar o status">
                                                <Chip
                                                    label={inscricao.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                                                    color={inscricao.status === 'confirmada' ? 'success' : 'warning'}
                                                    size="small"
                                                    onClick={() => handleConfirm(inscricao.id, inscricao.status || 'pendente')}
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
                                                onClick={() => handleDelete(inscricao.id, inscricao.esposo?.nome || 'casal')}
                                                title="Excluir inscrição"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

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
        </Box>
    );
}
