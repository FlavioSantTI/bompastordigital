import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Stack,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    IconButton,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
} from '@mui/material';
import {
    Add,
    GroupWork,
    Edit,
    Delete,
    Groups,
    Favorite,
    CheckCircle,
    HourglassEmpty,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { fetchCirculos, deleteCirculo, fetchInscritosDisponiveis } from '../../services/circuloService';
import CirculoDialog from './CirculoDialog';
import CirculoMembrosDialog from './CirculoMembrosDialog';
import type { Circulo } from '../../types';

interface EventoOpcao {
    id: number;
    nome: string;
}

export default function CirculosPage() {
    const [eventos, setEventos] = useState<EventoOpcao[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<number | ''>('');
    const [circulos, setCirculos] = useState<Circulo[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Métricas
    const [totalAlocados, setTotalAlocados] = useState(0);
    const [totalSemCirculo, setTotalSemCirculo] = useState(0);

    // Diálogos
    const [dialogCirculoOpen, setDialogCirculoOpen] = useState(false);
    const [selectedCirculoEdit, setSelectedCirculoEdit] = useState<Circulo | null>(null);

    const [dialogMembrosOpen, setDialogMembrosOpen] = useState(false);
    const [selectedCirculoMembros, setSelectedCirculoMembros] = useState<Circulo | null>(null);

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        carregarEventos();
    }, []);

    useEffect(() => {
        if (selectedEventoId) {
            carregarCirculosEMetricas(Number(selectedEventoId));
        } else {
            setCirculos([]);
            setTotalAlocados(0);
            setTotalSemCirculo(0);
        }
    }, [selectedEventoId]);

    const carregarEventos = async () => {
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select('id, nome')
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            setEventos(data || []);
            if (data && data.length > 0) {
                setSelectedEventoId(data[0].id);
            }
        } catch (err: any) {
            setError('Erro ao carregar lista de eventos: ' + err.message);
        }
    };

    const carregarCirculosEMetricas = async (eventoId: number) => {
        setLoading(true);
        setError('');
        try {
            const [listaCirculos, inscritosEvento] = await Promise.all([
                fetchCirculos(eventoId),
                fetchInscritosDisponiveis(eventoId),
            ]);

            setCirculos(listaCirculos);

            // Calcular métricas
            const alocados = inscritosEvento.filter(i => i.jaAlocadoOutroCirculo).length;
            const semCirculo = inscritosEvento.filter(i => !i.jaAlocadoOutroCirculo).length;

            setTotalAlocados(alocados);
            setTotalSemCirculo(semCirculo);
        } catch (err: any) {
            console.error('Erro ao carregar círculos:', err);
            setError('Erro ao carregar dados do evento: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNovoCirculo = () => {
        setSelectedCirculoEdit(null);
        setDialogCirculoOpen(true);
    };

    const handleOpenEditarCirculo = (circulo: Circulo) => {
        setSelectedCirculoEdit(circulo);
        setDialogCirculoOpen(true);
    };

    const handleOpenGerenciarMembros = (circulo: Circulo) => {
        setSelectedCirculoMembros(circulo);
        setDialogMembrosOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId || !selectedEventoId) return;
        setDeleting(true);
        try {
            await deleteCirculo(deleteTargetId);
            setDeleteTargetId(null);
            carregarCirculosEMetricas(Number(selectedEventoId));
        } catch (err: any) {
            setError('Erro ao excluir círculo: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header da Página */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1E3A5F' }}>
                        <GroupWork sx={{ color: '#0284C7' }} /> Gestão de Círculos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Organização de grupos de integração e trabalho com casais coordenadores e alocação de participantes.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    disabled={!selectedEventoId}
                    onClick={handleOpenNovoCirculo}
                    sx={{ bgcolor: '#0284C7', '&:hover': { bgcolor: '#0369A1' }, borderRadius: 2 }}
                >
                    Novo Círculo
                </Button>
            </Stack>

            {/* Seletor de Evento */}
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#F8FAFC' }}>
                <FormControl fullWidth size="small">
                    <InputLabel id="select-evento-circulos-label">Selecione o Evento Pastoral</InputLabel>
                    <Select
                        labelId="select-evento-circulos-label"
                        value={selectedEventoId}
                        label="Selecione o Evento Pastoral"
                        onChange={(e) => setSelectedEventoId(e.target.value as number)}
                    >
                        {eventos.map((ev) => (
                            <MenuItem key={ev.id} value={ev.id}>
                                {ev.nome}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Métricas do Evento */}
            {selectedEventoId && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid #0284C7' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                                    TOTAL DE CÍRCULOS
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" sx={{ color: '#0284C7', mt: 0.5 }}>
                                    {circulos.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid #059669' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                                    PARTICIPANTES ALOCADOS
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <CheckCircle color="success" fontSize="small" />
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#059669' }}>
                                        {totalAlocados}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid #D97706' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block">
                                    AGUARDANDO ALOCAÇÃO
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <HourglassEmpty color="warning" fontSize="small" />
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#D97706' }}>
                                        {totalSemCirculo}
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Lista / Grid de Círculos */}
            {loading ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography color="text.secondary" sx={{ mt: 1 }}>Carregando círculos...</Typography>
                </Box>
            ) : circulos.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#FAFAFA' }}>
                    <GroupWork sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">Nenhum círculo cadastrado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Crie os círculos do evento para organizar os grupos de trabalho e alocar os inscritos.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        disabled={!selectedEventoId}
                        onClick={handleOpenNovoCirculo}
                        sx={{ bgcolor: '#0284C7' }}
                    >
                        Criar Primeiro Círculo
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {circulos.map((c) => {
                        const casalNome = c.esposa_coordenador
                            ? `${c.esposo_coordenador?.nome || '—'} & ${c.esposa_coordenador.nome}`
                            : c.esposo_coordenador?.nome || '—';

                        return (
                            <Grid item xs={12} sm={6} md={4} key={c.id}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                            borderColor: c.cor || '#0284C7',
                                        },
                                    }}
                                >
                                    {/* Faixa Superior de Cor */}
                                    <Box
                                        sx={{
                                            height: 6,
                                            bgcolor: c.cor || '#0284C7',
                                            width: '100%',
                                        }}
                                    />

                                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                        {/* Título e Badge */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1E3A5F', lineHeight: 1.2 }}>
                                                {c.nome}
                                            </Typography>

                                            <Chip
                                                icon={<Groups fontSize="small" />}
                                                label={`${c.total_membros || 0} membro(s)`}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${c.cor}15`,
                                                    color: c.cor,
                                                    fontWeight: 'bold',
                                                    border: `1px solid ${c.cor}40`,
                                                }}
                                            />
                                        </Stack>

                                        {c.descricao && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
                                                {c.descricao}
                                            </Typography>
                                        )}

                                        {/* Bloco Casal Coordenador */}
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mt: 'auto' }}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary" display="flex" alignItems="center" gap={0.5} sx={{ mb: 0.5 }}>
                                                <Favorite fontSize="inherit" color="error" /> CASAL COORDENADOR:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0F172A' }}>
                                                {casalNome}
                                            </Typography>
                                            {c.esposo_coordenador?.telefone && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Contato: {c.esposo_coordenador.telefone}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>

                                    <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<Groups />}
                                            onClick={() => handleOpenGerenciarMembros(c)}
                                            sx={{
                                                bgcolor: c.cor || '#0284C7',
                                                '&:hover': { opacity: 0.9, bgcolor: c.cor || '#0284C7' },
                                                fontSize: 12,
                                                textTransform: 'none',
                                            }}
                                        >
                                            Membros ({c.total_membros || 0})
                                        </Button>

                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="Editar Círculo">
                                                <IconButton size="small" onClick={() => handleOpenEditarCirculo(c)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Excluir Círculo">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTargetId(c.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Modal de Criação / Edição de Círculo */}
            {selectedEventoId && (
                <CirculoDialog
                    open={dialogCirculoOpen}
                    eventoId={Number(selectedEventoId)}
                    circulo={selectedCirculoEdit}
                    onClose={() => setDialogCirculoOpen(false)}
                    onSave={() => carregarCirculosEMetricas(Number(selectedEventoId))}
                />
            )}

            {/* Modal de Gerenciamento de Membros */}
            {selectedEventoId && (
                <CirculoMembrosDialog
                    open={dialogMembrosOpen}
                    eventoId={Number(selectedEventoId)}
                    circulo={selectedCirculoMembros}
                    onClose={() => setDialogMembrosOpen(false)}
                    onSave={() => carregarCirculosEMetricas(Number(selectedEventoId))}
                />
            )}

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={!!deleteTargetId} onClose={() => setDeleteTargetId(null)}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Excluir Círculo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir este círculo? Os membros vinculados a ele serão desalocados e voltarão para a lista de aguardando alocação.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteTargetId(null)} disabled={deleting} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
                        {deleting ? 'Excluindo...' : 'Excluir Círculo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
