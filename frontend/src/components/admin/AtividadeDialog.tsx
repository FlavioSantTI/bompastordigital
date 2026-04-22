/**
 * AtividadeDialog — Modal lateral para criar/editar atividade do cronograma
 * Módulo Cronograma v4.0
 */
import { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    Alert,
    IconButton,
    Switch,
    FormControlLabel,
    Divider,
    Chip,
} from '@mui/material';
import { Close, Save, Delete } from '@mui/icons-material';
import type { Sala, Atividade, CategoriaAtividade, Categoria } from '../../types';
import { CATEGORIAS_CONFIG } from '../../types';
import {
    createAtividade,
    updateAtividade,
    deleteAtividade,
    validarConflitos,
} from '../../services/cronogramaService';

interface AtividadeDialogProps {
    open: boolean;
    onClose: () => void;
    eventoId: number;
    salas: Sala[];
    dataSelecionada: string;
    atividadesDoDia: Atividade[];
    editingAtividade?: Atividade | null;
    /** Pré-preencher sala e horário ao clicar numa célula da grade */
    presetSalaId?: number | null;
    presetHoraInicio?: string | null;
    /** Lista de categorias vindas do banco (apenas id e nome) */
    categorias: { id: number; nome: string }[];
    onUpdate: () => void;
}

// As categorias agora vêm dinamicamente por props: categoriaOptions

export default function AtividadeDialog({
    open,
    onClose,
    eventoId,
    salas,
    dataSelecionada,
    atividadesDoDia,
    editingAtividade,
    presetSalaId,
    presetHoraInicio,
    categorias,
    onUpdate,
}: AtividadeDialogProps) {
    const [titulo, setTitulo] = useState('');
    const [palestrante, setPalestrante] = useState('');
    const [categoria, setCategoria] = useState<CategoriaAtividade>('');
    const [salaId, setSalaId] = useState<number>(0);
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [descricao, setDescricao] = useState('');
    const [publicado, setPublicado] = useState(false);

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Popular form quando editando ou preset
    useEffect(() => {
        if (!open) return;

        if (editingAtividade) {
            setTitulo(editingAtividade.titulo);
            setPalestrante(editingAtividade.palestrante || '');
            setSalaId(editingAtividade.sala_id);
            setCategoria(editingAtividade.categoria);
            setHoraInicio(editingAtividade.hora_inicio.substring(0, 5));
            setHoraFim(editingAtividade.hora_fim.substring(0, 5));
            setDescricao(editingAtividade.descricao || '');
            setPublicado(editingAtividade.publicado);
        } else {
            setTitulo('');
            setPalestrante('');
            // Categoria: busca a "Palestra" ou a primeira da lista de forma robusta
            const safeCategorias = categorias || [];
            if (safeCategorias.length > 0) {
                // Tenta achar "Palestra" (independente de maiúscula ou espaço) ou pega a primeira
                const palestraCat = safeCategorias.find(c => c.nome.trim().toLowerCase() === 'palestra');
                const defaultCat = palestraCat ? palestraCat.nome : safeCategorias[0].nome;
                setCategoria(defaultCat);
            } else {
                setCategoria(''); // Se não tem categorias, deixa vazio até carregar
            }

            setDescricao('');
            setPublicado(false);

            // Sala e Horário
            const safeSalas = salas || [];
            const targetSalaId = presetSalaId || (safeSalas.length > 0 ? safeSalas[0].id : 0);
            if (targetSalaId) {
                setSalaId(targetSalaId);
            }

            if (presetHoraInicio) {
                setHoraInicio(presetHoraInicio);
            } else if (targetSalaId) {
                const safeAtividades = atividadesDoDia || [];
                const ultimaNaSala = safeAtividades
                    .filter(a => a.sala_id === targetSalaId)
                    .sort((a, b) => b.hora_fim.localeCompare(a.hora_fim))[0];

                if (ultimaNaSala) {
                    setHoraInicio(ultimaNaSala.hora_fim.substring(0, 5));
                } else {
                    setHoraInicio('08:00');
                }
            }
            setHoraFim('');
        }
        setError('');
    }, [open, editingAtividade, presetSalaId, presetHoraInicio, salas, categorias]);

    // Re-sugerir horário se trocar a sala (apenas para novas atividades)
    const handleSalaChange = (newSalaId: number) => {
        setSalaId(newSalaId);
        if (!editingAtividade) {
            const safeAtividades = atividadesDoDia || [];
            const ultimaNaSala = safeAtividades
                .filter(a => a.sala_id === newSalaId)
                .sort((a, b) => b.hora_fim.localeCompare(a.hora_fim))[0];
            
            if (ultimaNaSala) {
                setHoraInicio(ultimaNaSala.hora_fim.substring(0, 5));
            }
        }
    };

    const handleSubmit = async () => {
        setError('');

        // Validações básicas
        if (!titulo.trim()) {
            setError('O título é obrigatório.');
            return;
        }
        if (!salaId) {
            setError('Selecione uma sala.');
            return;
        }
        if (!horaInicio || !horaFim) {
            setError('Preencha os horários de início e término.');
            return;
        }
        if (horaFim <= horaInicio) {
            setError('O horário de término deve ser posterior ao de início.');
            return;
        }

        // Validação de conflitos
        const conflito = validarConflitos(
            { sala_id: salaId, palestrante, hora_inicio: horaInicio, hora_fim: horaFim },
            atividadesDoDia,
            editingAtividade?.id
        );

        if (!conflito.valido) {
            setError(conflito.mensagem);
            return;
        }

        setSaving(true);

        try {
            const payload = {
                evento_id: eventoId,
                sala_id: salaId,
                titulo: titulo.trim(),
                palestrante: palestrante.trim() || null,
                categoria,
                data: dataSelecionada,
                hora_inicio: horaInicio,
                hora_fim: horaFim,
                descricao: descricao.trim() || null,
                publicado,
            };

            if (editingAtividade) {
                await updateAtividade(editingAtividade.id, payload);
            } else {
                await createAtividade(payload);
            }

            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingAtividade) return;
        if (!confirm(`Excluir a atividade "${editingAtividade.titulo}"?`)) return;

        setSaving(true);
        try {
            await deleteAtividade(editingAtividade.id);
            onUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Header: cor e ícone fixos (não dependem mais de categoria do banco)
    const categoriaConfig = {
        cor: '#1e3a5f',
        corFundo: '#f0f4f8',
        icone: '📅'
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{ 
                zIndex: 3000, // Força a ficar acima de tudo (inclusive do Navbar)
                '& .MuiBackdrop-root': { bgcolor: 'rgba(0,0,0,0.3)' } 
            }}
            PaperProps={{
                sx: { 
                    width: { xs: '95%', sm: 400 }, 
                    m: { xs: 0, sm: 2 }, 
                    borderRadius: { xs: 0, sm: 2 }, 
                    p: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 'auto', 
                    maxHeight: 'calc(100% - 32px)', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    zIndex: 3001 // Papeis dentro do drawer um pouco acima
                },
            }}
        >
            {/* Header - Mais compacto */}
            <Box
                sx={{
                    p: 1.5,
                    px: 2,
                    background: `linear-gradient(135deg, ${categoriaConfig.cor}15, ${categoriaConfig.cor}05)`,
                    borderBottom: `2px solid ${categoriaConfig.cor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                {categoriaConfig.icone.startsWith('/') ? (
                    <img src={categoriaConfig.icone} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                ) : (
                    <Typography sx={{ fontSize: 20 }}>{categoriaConfig.icone}</Typography>
                )}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {editingAtividade ? 'Editar Atividade' : 'Nova Atividade'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {dataSelecionada.split('-').reverse().join('/')}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* Body - Área de Conteúdo */}
            <Box sx={{ 
                p: 2.5, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                overflowY: 'auto',
                bgcolor: 'background.paper'
            }}>
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ py: 0.5 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        id="atividade-titulo"
                        label="Título da Atividade"
                        fullWidth
                        required
                        size="small"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Palestra de Abertura"
                        autoFocus
                    />

                    <TextField
                        id="atividade-palestrante"
                        label="Palestrante"
                        fullWidth
                        size="small"
                        value={palestrante}
                        onChange={(e) => setPalestrante(e.target.value)}
                        placeholder="Nome do palestrante (opcional)"
                        helperText="Use nomes para validar conflitos de agenda"
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        id="atividade-categoria"
                        label="Categoria"
                        select
                        fullWidth
                        required
                        size="small"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as any)}
                        SelectProps={{
                            native: true
                        }}
                    >
                        <option value="" disabled>Selecione uma categoria...</option>
                        {(categorias || []).map((cat) => (
                            <option key={cat.id} value={cat.nome}>
                                {cat.nome}
                            </option>
                        ))}
                    </TextField>

                    <TextField
                        id="atividade-sala"
                        label="Sala"
                        select
                        fullWidth
                        required
                        size="small"
                        value={salaId || ''}
                        onChange={(e) => handleSalaChange(Number(e.target.value))}
                        SelectProps={{ 
                            native: true 
                        }}
                    >
                        <option value="" disabled>Selecione uma sala...</option>
                        {(salas || []).map((sala) => (
                            <option key={sala.id} value={sala.id}>
                                {sala.nome}
                            </option>
                        ))}
                    </TextField>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Início"
                        type="time"
                        fullWidth
                        required
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        helperText={!editingAtividade && !presetHoraInicio && horaInicio ? "Início ajustado após a atividade anterior" : ""}
                    />
                    <TextField
                        label="Término"
                        type="time"
                        fullWidth
                        required
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={horaFim}
                        onChange={(e) => setHoraFim(e.target.value)}
                        inputProps={{ min: horaInicio }}
                    />
                </Box>

                <TextField
                    label="Descrição da Atividade (Opcional)"
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'grey.50',
                            fontSize: '0.875rem'
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.875rem'
                        }
                    }}
                />

                <Divider />

                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={publicado}
                            onChange={(e) => setPublicado(e.target.checked)}
                            color="success"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="caption" fontWeight="bold" sx={{ display: 'block' }}>
                                Publicar na Agenda
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                Visível para participantes na timeline
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    p: 2,
                    px: 3,
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#fcfcfc',
                    borderRadius: '0 0 16px 16px'
                }}
            >
                <Box>
                    {editingAtividade && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => {
                                if (confirm('Excluir esta atividade permanentemente?')) {
                                    handleDelete();
                                }
                            }}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 'bold',
                                borderRadius: 2,
                                px: 2
                            }}
                        >
                            Excluir
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button 
                        onClick={onClose} 
                        variant="text"
                        sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 'medium' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSubmit}
                        disabled={saving || !titulo || !salaId}
                        sx={{
                            bgcolor: '#1e3a5f',
                            color: 'white !important',
                            fontWeight: 'bold',
                            px: 3,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#2a528a' },
                            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)'
                        }}
                    >
                        {saving ? 'Salvando...' : (editingAtividade ? 'Salvar' : 'Criar')}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
