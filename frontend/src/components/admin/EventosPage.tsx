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
    TextField,
    IconButton,
    Alert,
    CircularProgress,
    MenuItem,
    Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import MunicipioAutocomplete from '../common/MunicipioAutocomplete';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
    data_fim: string;
    hora_inicio?: string;
    hora_fim?: string;
    municipio_id: number;
    vagas: number;
    status: string;
    municipio?: {
        nome_ibge: string;
        uf: string;
    };
}

const STATUS_OPTIONS = [
    { value: 'aberto', label: 'Aberto', color: 'success' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'info' },
    { value: 'concluido', label: 'Concluído', color: 'default' },
    { value: 'cancelado', label: 'Cancelado', color: 'error' },
];

export default function EventosPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        data_inicio: '',
        data_fim: '',
        hora_inicio: '',
        hora_fim: '',
        municipio_id: 0,
        vagas: 50,
        status: 'aberto',
    });

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .order('data_inicio', { ascending: false });

        if (error) {
            setError('Erro ao carregar eventos: ' + error.message);
            setEventos([]);
        } else {
            // Buscar informações dos municípios
            const eventosComLocal = await Promise.all(
                (data || []).map(async (evento) => {
                    if (evento.municipio_id) {
                        const { data: municipio } = await supabase
                            .from('municipios')
                            .select('nome_ibge, uf')
                            .eq('codigo_tom', evento.municipio_id)
                            .single();

                        return { ...evento, municipio };
                    }
                    return evento;
                })
            );
            setEventos(eventosComLocal);
        }
        setLoading(false);
    };

    const handleOpenDialog = (evento?: Evento) => {
        if (evento) {
            setEditingEvento(evento);
            setFormData({
                nome: evento.nome,
                data_inicio: evento.data_inicio,
                data_fim: evento.data_fim,
                hora_inicio: evento.hora_inicio || '',
                hora_fim: evento.hora_fim || '',
                municipio_id: evento.municipio_id,
                vagas: evento.vagas,
                status: evento.status,
            });
        } else {
            setEditingEvento(null);
            setFormData({
                nome: '',
                data_inicio: '',
                data_fim: '',
                hora_inicio: '',
                hora_fim: '',
                municipio_id: 0,
                vagas: 50,
                status: 'aberto',
            });
        }
        setOpenDialog(true);
        setError('');
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEvento(null);
        setFormData({
            nome: '',
            data_inicio: '',
            data_fim: '',
            hora_inicio: '',
            hora_fim: '',
            municipio_id: 0,
            vagas: 50,
            status: 'aberto',
        });
        setError('');
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        // Validações
        if (!formData.nome || !formData.data_inicio || !formData.data_fim || !formData.municipio_id) {
            setError('Todos os campos obrigatórios devem ser preenchidos');
            return;
        }

        if (formData.vagas <= 0) {
            setError('Número de vagas deve ser maior que zero');
            return;
        }

        // Validar datas
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataInicio = new Date(formData.data_inicio);
        const dataFim = new Date(formData.data_fim);

        if (dataInicio < hoje) {
            setError('A data de início não pode ser anterior a hoje');
            return;
        }

        if (dataFim < dataInicio) {
            setError('A data de término não pode ser anterior à data de início');
            return;
        }

        console.log('Enviando dados:', formData);

        if (editingEvento) {
            // Update
            const { error } = await supabase
                .from('eventos')
                .update(formData)
                .eq('id', editingEvento.id);

            if (error) {
                console.error('Erro ao atualizar:', error);
                setError('Erro ao atualizar: ' + error.message);
            } else {
                setSuccess('Evento atualizado com sucesso!');
                handleCloseDialog();
                fetchEventos();
            }
        } else {
            // Insert
            const { data, error } = await supabase
                .from('eventos')
                .insert([formData])
                .select();

            if (error) {
                console.error('Erro ao criar:', error);
                setError('Erro ao criar: ' + error.message);
            } else {
                console.log('Evento criado:', data);
                setSuccess('Evento criado com sucesso!');
                handleCloseDialog();
                fetchEventos();
            }
        }
    };

    const handleDelete = async (id: number, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir o evento "${nome}"?`)) {
            return;
        }

        const { error } = await supabase
            .from('eventos')
            .delete()
            .eq('id', id);

        if (error) {
            setError('Erro ao excluir: ' + error.message);
        } else {
            setSuccess('Evento excluído com sucesso!');
            fetchEventos();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5); // HH:MM
    };

    const getStatusChip = (status: string) => {
        const statusOption = STATUS_OPTIONS.find(s => s.value === status);
        return (
            <Chip
                label={statusOption?.label || status}
                color={statusOption?.color as any || 'default'}
                size="small"
            />
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Gerenciar Eventos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Novo Evento
                </Button>
            </Box>

            {error && success === '' && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
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
                                <TableCell><strong>Nome</strong></TableCell>
                                <TableCell><strong>Período</strong></TableCell>
                                <TableCell><strong>Local</strong></TableCell>
                                <TableCell><strong>Vagas</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        Nenhum evento cadastrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                eventos.map((evento) => (
                                    <TableRow key={evento.id}>
                                        <TableCell>{evento.nome}</TableCell>
                                        <TableCell>
                                            <div>{formatDate(evento.data_inicio)} - {formatDate(evento.data_fim)}</div>
                                            {(evento.hora_inicio || evento.hora_fim) && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTime(evento.hora_inicio)} - {formatTime(evento.hora_fim)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {evento.municipio ? `${evento.municipio.nome_ibge} - ${evento.municipio.uf}` : '-'}
                                        </TableCell>
                                        <TableCell>{evento.vagas}</TableCell>
                                        <TableCell>{getStatusChip(evento.status)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(evento)}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(evento.id, evento.nome)}
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

            {/* Dialog de Criar/Editar */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingEvento ? 'Editar Evento' : 'Novo Evento'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Nome do Evento"
                            fullWidth
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Encontro de Casais com Cristo - Março 2026"
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Data de Início"
                                type="date"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: new Date().toISOString().split('T')[0]
                                }}
                                value={formData.data_inicio}
                                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                helperText="Somente datas futuras"
                            />
                            <TextField
                                label="Data de Término"
                                type="date"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: formData.data_inicio || new Date().toISOString().split('T')[0]
                                }}
                                value={formData.data_fim}
                                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                helperText={formData.data_inicio ? "Deve ser igual ou após a data de início" : "Somente datas futuras"}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Hora de Início"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.hora_inicio}
                                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                helperText="Opcional"
                            />
                            <TextField
                                label="Hora de Término"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.hora_fim}
                                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                helperText="Opcional"
                            />
                        </Box>

                        <MunicipioAutocomplete
                            value={formData.municipio_id}
                            onChange={(codigo_tom) => setFormData({ ...formData, municipio_id: codigo_tom })}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Vagas"
                                type="number"
                                fullWidth
                                required
                                value={formData.vagas}
                                onChange={(e) => setFormData({ ...formData, vagas: parseInt(e.target.value) || 0 })}
                                helperText="Deve ser maior que zero"
                                inputProps={{ min: 1 }}
                            />
                            <TextField
                                label="Status"
                                fullWidth
                                required
                                select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingEvento ? 'Salvar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
