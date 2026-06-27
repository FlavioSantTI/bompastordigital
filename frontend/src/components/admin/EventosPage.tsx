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
    ToggleButtonGroup,
    ToggleButton,
    Collapse,
    FormHelperText,
    InputAdornment,
    FormControlLabel,
    Switch,
    Tooltip,
    Divider,
} from '@mui/material';
import { Add, Edit, Delete, CalendarMonth, HowToReg } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import MunicipioAutocomplete from '../common/MunicipioAutocomplete';
import { validatePixKey } from '../../services/pixService';
import type { Evento, EventoStatus } from '../../types';
import { computeEventStatus, getStatusConfig, formatDateTime, toISOWithTimezone, toDatetimeLocal } from '../../utils/eventStatusUtils';

// Filtro de status para a listagem
const STATUS_FILTER_OPTIONS: { value: EventoStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'DRAFT', label: '📝 Rascunho' },
    { value: 'REGISTRATION_UPCOMING', label: '🔜 Inscrições em Breve' },
    { value: 'REGISTRATION_OPEN', label: '✅ Inscrições Abertas' },
    { value: 'REGISTRATION_CLOSED', label: '⏳ Inscrições Encerradas' },
    { value: 'IN_PROGRESS', label: '🔴 Em Andamento' },
    { value: 'FINISHED', label: '⬛ Encerrado' },
    { value: 'CANCELLED', label: '🚫 Cancelado' },
];

export default function EventosPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventoStatus | 'ALL'>('ALL');

    // Form state com novos campos de período
    const [formData, setFormData] = useState({
        nome: '',
        inscricao_inicio: '',
        inscricao_fim: '',
        realizacao_inicio: '',
        realizacao_fim: '',
        municipio_id: 0,
        vagas: 50,
        publicado: false,
        is_paid: false,
        event_price: '',
        pix_key_type: '',
        pix_key: '',
        merchant_name: '',
        merchant_city: '',
    });

    // Erros de validação por campo
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .order('realizacao_inicio', { ascending: false });

        if (error) {
            setError('Erro ao carregar eventos: ' + error.message);
            setEventos((data || []) as unknown as Evento[]);
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
            const finalEventos = eventosComLocal.map((evt: any) => {
                const mun = evt.municipio;
                return {
                    ...evt,
                    municipio: mun ? {
                        nome_ibge: mun.nome_ibge || null,
                        uf: mun.uf || null
                    } : undefined
                };
            }) as Evento[];
            setEventos(finalEventos);
        }
        setLoading(false);
    };

    const handlePriceChange = (val: string) => {
        const clean = val.replace(/\D/g, '');
        if (!clean) {
            setFormData(prev => ({ ...prev, event_price: '' }));
            return;
        }
        const numeric = parseInt(clean, 10) / 100;
        const formatted = numeric.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        setFormData(prev => ({ ...prev, event_price: formatted }));
    };

    // Validação de períodos em tempo real (on blur)
    const validatePeriods = (data: typeof formData): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (data.inscricao_inicio && data.inscricao_fim) {
            if (new Date(data.inscricao_inicio) >= new Date(data.inscricao_fim)) {
                errors.inscricao_fim = 'O início das inscrições deve ser anterior ao encerramento.';
            }
        }

        if (data.inscricao_fim && data.realizacao_inicio) {
            if (new Date(data.inscricao_fim) >= new Date(data.realizacao_inicio)) {
                errors.realizacao_inicio = 'As inscrições devem encerrar antes do início do evento.';
            }
        }

        if (data.realizacao_inicio && data.realizacao_fim) {
            if (new Date(data.realizacao_inicio) >= new Date(data.realizacao_fim)) {
                errors.realizacao_fim = 'O início do evento deve ser anterior ao seu encerramento.';
            }
        }

        return errors;
    };

    const handleFieldBlur = (field: string) => {
        const errors = validatePeriods(formData);
        setFieldErrors(prev => {
            const next = { ...prev };
            // Limpar erros dos campos de período primeiro
            delete next.inscricao_fim;
            delete next.realizacao_inicio;
            delete next.realizacao_fim;
            // Setar novos erros
            return { ...next, ...errors };
        });
    };

    // Auto-sugestão: ao preencher inscricao_fim, sugerir realizacao_inicio
    const handleInscricaoFimChange = (value: string) => {
        const updated = { ...formData, inscricao_fim: value };
        if (value && !formData.realizacao_inicio) {
            // Sugerir realizacao_inicio como inscricao_fim + 1 dia
            const dt = new Date(value);
            dt.setDate(dt.getDate() + 1);
            const suggested = dt.toISOString().slice(0, 16);
            updated.realizacao_inicio = suggested;
        }
        setFormData(updated);
    };

    const handleOpenDialog = (evento?: Evento) => {
        if (evento) {
            setEditingEvento(evento);
            
            // Formatar preço de float para máscara pt-BR (ex: 150.00 -> "150,00")
            let formattedPrice = '';
            if (evento.event_price !== undefined && evento.event_price !== null) {
                formattedPrice = evento.event_price.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

            setFormData({
                nome: evento.nome,
                inscricao_inicio: toDatetimeLocal(evento.inscricao_inicio),
                inscricao_fim: toDatetimeLocal(evento.inscricao_fim),
                realizacao_inicio: toDatetimeLocal(evento.realizacao_inicio),
                realizacao_fim: toDatetimeLocal(evento.realizacao_fim),
                municipio_id: evento.municipio_id || 0,
                vagas: evento.vagas,
                publicado: evento.publicado || false,
                is_paid: evento.is_paid || false,
                event_price: formattedPrice,
                pix_key_type: evento.pix_key_type || '',
                pix_key: evento.pix_key || '',
                merchant_name: evento.merchant_name || '',
                merchant_city: evento.merchant_city || '',
            });
        } else {
            setEditingEvento(null);
            setFormData({
                nome: '',
                inscricao_inicio: '',
                inscricao_fim: '',
                realizacao_inicio: '',
                realizacao_fim: '',
                municipio_id: 0,
                vagas: 50,
                publicado: false,
                is_paid: false,
                event_price: '',
                pix_key_type: '',
                pix_key: '',
                merchant_name: '',
                merchant_city: '',
            });
        }
        setOpenDialog(true);
        setError('');
        setFieldErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEvento(null);
        setFormData({
            nome: '',
            inscricao_inicio: '',
            inscricao_fim: '',
            realizacao_inicio: '',
            realizacao_fim: '',
            municipio_id: 0,
            vagas: 50,
            publicado: false,
            is_paid: false,
            event_price: '',
            pix_key_type: '',
            pix_key: '',
            merchant_name: '',
            merchant_city: '',
        });
        setError('');
        setFieldErrors({});
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        // Validações obrigatórias
        if (!formData.nome) {
            setError('O nome do evento é obrigatório.');
            return;
        }

        if (!formData.inscricao_inicio || !formData.inscricao_fim || !formData.realizacao_inicio || !formData.realizacao_fim) {
            setError('Todos os campos de período (inscrição e realização) são obrigatórios.');
            return;
        }

        if (!formData.municipio_id) {
            setError('O município é obrigatório.');
            return;
        }

        if (formData.vagas <= 0) {
            setError('Número de vagas deve ser maior que zero.');
            return;
        }

        // Validar períodos
        const periodErrors = validatePeriods(formData);
        if (Object.keys(periodErrors).length > 0) {
            setFieldErrors(periodErrors);
            setError(Object.values(periodErrors)[0]);
            return;
        }

        // Validações de pagamento
        let parsedPrice = null;
        if (formData.is_paid) {
            if (!formData.event_price) {
                setError('Valor da inscrição é obrigatório para eventos pagos');
                return;
            }
            const cleanPriceStr = formData.event_price.replace(/\./g, '').replace(',', '.');
            parsedPrice = parseFloat(cleanPriceStr);
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                setError('Valor da inscrição deve ser maior que zero');
                return;
            }

            if (!formData.pix_key_type) {
                setError('Selecione o tipo de chave PIX');
                return;
            }

            if (!formData.pix_key) {
                setError('A chave PIX é obrigatória');
                return;
            }

            const keyValidation = validatePixKey(formData.pix_key_type, formData.pix_key);
            if (!keyValidation.isValid) {
                setError(keyValidation.error || 'Chave PIX inválida');
                return;
            }

            if (!formData.merchant_name.trim()) {
                setError('Nome do beneficiário é obrigatório');
                return;
            }

            if (!formData.merchant_city.trim()) {
                setError('Cidade do beneficiário é obrigatória');
                return;
            }
        }

        const payload: Record<string, any> = {
            nome: formData.nome,
            inscricao_inicio: toISOWithTimezone(formData.inscricao_inicio),
            inscricao_fim: toISOWithTimezone(formData.inscricao_fim),
            realizacao_inicio: toISOWithTimezone(formData.realizacao_inicio),
            realizacao_fim: toISOWithTimezone(formData.realizacao_fim),
            // Manter campos legados para compatibilidade durante migração
            data_inicio: formData.realizacao_inicio.split('T')[0],
            data_fim: formData.realizacao_fim.split('T')[0],
            hora_inicio: formData.realizacao_inicio.split('T')[1] || null,
            hora_fim: formData.realizacao_fim.split('T')[1] || null,
            municipio_id: formData.municipio_id,
            vagas: formData.vagas,
            publicado: formData.publicado,
            status_manual: editingEvento?.status_manual || null,
            is_paid: formData.is_paid,
            event_price: parsedPrice,
            pix_key_type: formData.is_paid ? formData.pix_key_type : null,
            pix_key: formData.is_paid ? formData.pix_key : null,
            merchant_name: formData.is_paid ? formData.merchant_name : null,
            merchant_city: formData.is_paid ? formData.merchant_city : null,
            accepted_payment_methods: formData.is_paid ? ['pix'] : null
        };

        console.log('Enviando dados:', payload);

        if (editingEvento) {
            const { error } = await supabase
                .from('eventos')
                .update(payload)
                .eq('id', editingEvento.id);

            if (error) {
                console.error('Erro ao atualizar:', error);
                if (error.message.includes('chk_periodos_evento')) {
                    setError('Erro de validação: A ordem cronológica dos períodos está inválida. Verifique se as inscrições encerram antes do evento começar.');
                } else {
                    setError('Erro ao atualizar: ' + error.message);
                }
            } else {
                setSuccess('Evento atualizado com sucesso!');
                handleCloseDialog();
                fetchEventos();
            }
        } else {
            const { data, error } = await supabase
                .from('eventos')
                .insert([payload])
                .select();

            if (error) {
                console.error('Erro ao criar:', error);
                if (error.message.includes('chk_periodos_evento')) {
                    setError('Erro de validação: A ordem cronológica dos períodos está inválida. Verifique se as inscrições encerram antes do evento começar.');
                } else {
                    setError('Erro ao criar: ' + error.message);
                }
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

    const handleCancelEvent = async (evento: Evento) => {
        if (!confirm(`Tem certeza que deseja CANCELAR o evento "${evento.nome}"? Esta ação pode ser revertida.`)) {
            return;
        }
        const { error } = await supabase
            .from('eventos')
            .update({ status_manual: 'cancelado' })
            .eq('id', evento.id);

        if (error) {
            setError('Erro ao cancelar: ' + error.message);
        } else {
            setSuccess('Evento cancelado com sucesso!');
            fetchEventos();
        }
    };

    // Renderizar Chip de status computado
    const renderStatusChip = (evento: Evento) => {
        const status = computeEventStatus(evento);
        const config = getStatusConfig(status);
        return (
            <Chip
                label={`${config.icon} ${config.label}`}
                color={config.color}
                size="small"
                variant={config.variant || 'filled'}
            />
        );
    };

    // Filtrar eventos por status computado
    const filteredEventos = statusFilter === 'ALL'
        ? eventos
        : eventos.filter(e => computeEventStatus(e) === statusFilter);

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

            {/* Filtro por Status */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    select
                    size="small"
                    label="Filtrar por Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EventoStatus | 'ALL')}
                    sx={{ minWidth: 240 }}
                >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

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
                                <TableCell><strong>Inscrição</strong></TableCell>
                                <TableCell><strong>Realização</strong></TableCell>
                                <TableCell><strong>Local</strong></TableCell>
                                <TableCell><strong>Entrada</strong></TableCell>
                                <TableCell><strong>Vagas</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEventos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        Nenhum evento encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEventos.map((evento) => (
                                    <TableRow key={evento.id}>
                                        <TableCell>
                                            <Box>
                                                {evento.nome}
                                                {!evento.publicado && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        (não publicado)
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDateTime(evento.inscricao_inicio)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                até {formatDateTime(evento.inscricao_fim)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDateTime(evento.realizacao_inicio)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                até {formatDateTime(evento.realizacao_fim)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {evento.municipio ? `${evento.municipio.nome_ibge} - ${evento.municipio.uf}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {evento.is_paid ? (
                                                <Chip 
                                                    label={`Pago: R$ ${evento.event_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                                    color="warning" 
                                                    size="small" 
                                                />
                                            ) : (
                                                <Chip 
                                                    label="Gratuito" 
                                                    color="success" 
                                                    size="small" 
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{evento.vagas}</TableCell>
                                        <TableCell>{renderStatusChip(evento)}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(evento)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDelete(evento.id, evento.nome)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
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
                        {/* ═══ DADOS DO EVENTO ═══ */}
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            📋 Dados do Evento
                        </Typography>

                        <TextField
                            label="Nome do Evento"
                            fullWidth
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Encontro de Casais com Cristo - Julho 2026"
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <MunicipioAutocomplete
                                value={formData.municipio_id}
                                onChange={(codigo_tom) => setFormData({ ...formData, municipio_id: codigo_tom })}
                            />
                            <TextField
                                label="Vagas"
                                type="number"
                                sx={{ minWidth: 120 }}
                                required
                                value={formData.vagas}
                                onChange={(e) => setFormData({ ...formData, vagas: parseInt(e.target.value) || 0 })}
                                inputProps={{ min: 1 }}
                            />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* ═══ PERÍODO DE INSCRIÇÃO ═══ */}
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            <HowToReg sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Período de Inscrição
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Início das Inscrições"
                                type="datetime-local"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.inscricao_inicio}
                                onChange={(e) => setFormData({ ...formData, inscricao_inicio: e.target.value })}
                                onBlur={() => handleFieldBlur('inscricao_inicio')}
                                helperText="Data e hora em que as inscrições abrem"
                            />
                            <TextField
                                label="Encerramento das Inscrições"
                                type="datetime-local"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.inscricao_fim}
                                onChange={(e) => handleInscricaoFimChange(e.target.value)}
                                onBlur={() => handleFieldBlur('inscricao_fim')}
                                error={!!fieldErrors.inscricao_fim}
                                helperText={fieldErrors.inscricao_fim || 'Data e hora em que as inscrições encerram'}
                            />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* ═══ PERÍODO DE REALIZAÇÃO ═══ */}
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            <CalendarMonth sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Período de Realização
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Início do Evento"
                                type="datetime-local"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.realizacao_inicio}
                                onChange={(e) => setFormData({ ...formData, realizacao_inicio: e.target.value })}
                                onBlur={() => handleFieldBlur('realizacao_inicio')}
                                error={!!fieldErrors.realizacao_inicio}
                                helperText={fieldErrors.realizacao_inicio || 'Data e hora do início do evento'}
                            />
                            <TextField
                                label="Encerramento do Evento"
                                type="datetime-local"
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                value={formData.realizacao_fim}
                                onChange={(e) => setFormData({ ...formData, realizacao_fim: e.target.value })}
                                onBlur={() => handleFieldBlur('realizacao_fim')}
                                error={!!fieldErrors.realizacao_fim}
                                helperText={fieldErrors.realizacao_fim || 'Data e hora do encerramento do evento'}
                            />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* ═══ PUBLICAÇÃO ═══ */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.publicado}
                                    onChange={(e) => setFormData({ ...formData, publicado: e.target.checked })}
                                    color="success"
                                />
                            }
                            label="☑️ Publicar evento (torna visível publicamente)"
                        />
                        {!formData.publicado && (
                            <FormHelperText>
                                Eventos não publicados ficam como rascunho e não aparecem na listagem pública.
                            </FormHelperText>
                        )}

                        <Divider sx={{ my: 1 }} />

                        {/* ═══ TIPO DE ENTRADA ═══ */}
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Tipo de Entrada
                            </Typography>
                            <ToggleButtonGroup
                                value={formData.is_paid ? 'pago' : 'gratuito'}
                                exclusive
                                onChange={(_, val) => {
                                    if (val !== null) {
                                        setFormData(prev => ({
                                            ...prev,
                                            is_paid: val === 'pago',
                                            ...(val === 'gratuito' && {
                                                event_price: '',
                                                pix_key_type: '',
                                                pix_key: '',
                                                merchant_name: '',
                                                merchant_city: '',
                                            })
                                        }));
                                    }
                                }}
                                fullWidth
                                color="primary"
                            >
                                <ToggleButton value="gratuito">🎟️ Gratuito</ToggleButton>
                                <ToggleButton value="pago">💰 Pago</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Collapse in={formData.is_paid}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    Configuração de Recebimento e Valor
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Valor da Inscrição"
                                        fullWidth
                                        required={formData.is_paid}
                                        value={formData.event_price}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        placeholder="0,00"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                        }}
                                        helperText="Bloqueia valores nulos, zerados ou negativos"
                                    />
                                    
                                    <TextField
                                        label="Tipo de Chave PIX"
                                        fullWidth
                                        select
                                        required={formData.is_paid}
                                        value={formData.pix_key_type}
                                        onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value, pix_key: '' })}
                                    >
                                        <MenuItem value="CPF">CPF</MenuItem>
                                        <MenuItem value="CNPJ">CNPJ</MenuItem>
                                        <MenuItem value="E-mail">E-mail</MenuItem>
                                        <MenuItem value="Telefone">Telefone</MenuItem>
                                        <MenuItem value="Chave Aleatória">Chave Aleatória (EVP)</MenuItem>
                                    </TextField>
                                </Box>

                                <TextField
                                    label="Chave PIX"
                                    fullWidth
                                    required={formData.is_paid}
                                    value={formData.pix_key}
                                    placeholder={
                                        formData.pix_key_type === 'CPF' ? '000.000.000-00' :
                                        formData.pix_key_type === 'CNPJ' ? '00.000.000/0000-00' :
                                        formData.pix_key_type === 'E-mail' ? 'email@exemplo.com' :
                                        formData.pix_key_type === 'Telefone' ? '+5563999999999' :
                                        formData.pix_key_type === 'Chave Aleatória' ? 'Formato UUID' : 'Selecione o tipo de chave primeiro'
                                    }
                                    disabled={!formData.pix_key_type}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (formData.pix_key_type === 'CPF' || formData.pix_key_type === 'CNPJ' || formData.pix_key_type === 'Telefone') {
                                            val = val.trim();
                                        }
                                        setFormData({ ...formData, pix_key: val });
                                    }}
                                    error={formData.is_paid && formData.pix_key !== '' && !validatePixKey(formData.pix_key_type, formData.pix_key).isValid}
                                    helperText={
                                        formData.is_paid && formData.pix_key !== '' 
                                            ? validatePixKey(formData.pix_key_type, formData.pix_key).error 
                                            : 'Insira a chave conforme o tipo selecionado'
                                    }
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Nome do Beneficiário"
                                        fullWidth
                                        required={formData.is_paid}
                                        value={formData.merchant_name}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setFormData({ ...formData, merchant_name: val });
                                        }}
                                        helperText="Ex: IGREJA PAROQUIAL BOM PASTOR"
                                        inputProps={{ maxLength: 25 }}
                                    />
                                    <TextField
                                        label="Cidade do Beneficiário"
                                        fullWidth
                                        required={formData.is_paid}
                                        value={formData.merchant_city}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setFormData({ ...formData, merchant_city: val });
                                        }}
                                        helperText="Ex: PALMAS"
                                        inputProps={{ maxLength: 15 }}
                                    />
                                </Box>
                            </Paper>
                        </Collapse>
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
