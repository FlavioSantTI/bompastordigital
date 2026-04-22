/**
 * CronogramaPage — Builder Visual de Cronograma (Admin)
 * Grade de Salas × Horários com abas por dia
 * Módulo Cronograma v4.0
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    TextField,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Checkbox,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Settings,
    Add,
    Refresh,
    Publish,
    Visibility,
    VisibilityOff,
    FileDownload,
    PictureAsPdf,
    Category,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import type { Sala, Atividade, CategoriaAtividade, Categoria } from '../../types';
import { CATEGORIAS_CONFIG } from '../../types';
import {
    fetchSalasByEvento,
    fetchAtividadesByEventoEData,
    fetchCategoriasByEvento,
    togglePublicarAtividades,
    gerarDatasEvento,
    gerarSlotsHorario,
    formatDataCurta,
    formatTime,
    timeToMinutes,
    exportarCronogramaPDF,
    exportarCronogramaExcel,
} from '../../services/cronogramaService';
import SalasDialog from './SalasDialog';
import AtividadeDialog from './AtividadeDialog';
import CategoriasDialog from './CategoriasDialog';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
    data_fim: string;
    status: string | null;
}

export default function CronogramaPage() {
    const theme = useTheme();

    // Seleção de evento
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<number>(0);
    const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

    // Dados do cronograma
    const [salas, setSalas] = useState<Sala[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [datas, setDatas] = useState<string[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const dataSelecionada = datas[tabIndex] || '';

    // UI States
    const [loading, setLoading] = useState(false);
    const [loadingGrid, setLoadingGrid] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialogs
    const [salasDialogOpen, setSalasDialogOpen] = useState(false);
    const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
    const [atividadeDialogOpen, setAtividadeDialogOpen] = useState(false);
    const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null);
    const [presetSalaId, setPresetSalaId] = useState<number | null>(null);
    const [presetHoraInicio, setPresetHoraInicio] = useState<string | null>(null);

    // Seleção para publicação em lote
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Horários da grade
    const slots = gerarSlotsHorario(6, 23, 30);

    // ============================
    // Carregar eventos iniciais
    // ============================
    useEffect(() => {
        loadEventos();
    }, []);

    const loadEventos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('eventos')
            .select('id, nome, data_inicio, data_fim, status')
            .order('data_inicio', { ascending: false });

        if (error) {
            setError('Erro ao carregar eventos: ' + error.message);
        } else {
            setEventos((data || []) as Evento[]);
            // Pré-selecionar o primeiro evento
            if (data && data.length > 0 && !selectedEventoId) {
                handleSelectEvento(data[0].id, data as Evento[]);
            }
        }
        setLoading(false);
    };

    const handleSelectEvento = (eventoId: number, evtList?: Evento[]) => {
        const lista = evtList || eventos;
        const evt = lista.find(e => e.id === eventoId);
        setSelectedEventoId(eventoId);
        setSelectedEvento(evt || null);
        setSelectedIds(new Set());

        if (evt) {
            const d = gerarDatasEvento(evt.data_inicio, evt.data_fim);
            setDatas(d);
            setTabIndex(0);
        }
    };

    // ============================
    // Carregar grade ao trocar evento/data
    // ============================
    // 1. Carregar Salas e Categorias (nível Evento)
    useEffect(() => {
        if (selectedEventoId) {
            loadSalasECategorias(selectedEventoId);
        }
    }, [selectedEventoId]);

    // 2. Carregar Atividades (nível Data)
    useEffect(() => {
        if (selectedEventoId && dataSelecionada) {
            loadAtividades();
        }
    }, [selectedEventoId, dataSelecionada]);

    const loadSalasECategorias = async (eventoId: number) => {
        if (!eventoId) return;
        try {
            const [salasData, categoriasData] = await Promise.all([
                fetchSalasByEvento(eventoId).catch(() => []),
                fetchCategoriasByEvento(eventoId).catch(() => []),
            ]);
            setSalas(salasData);
            setCategorias(categoriasData);
        } catch (err: any) {
            console.error("Erro ao carregar bases:", err);
        }
    };

    const loadAtividades = async () => {
        if (!selectedEventoId || !dataSelecionada) return;
        setLoadingGrid(true);
        try {
            const atividadesData = await fetchAtividadesByEventoEData(selectedEventoId, dataSelecionada);
            setAtividades(atividadesData || []);
        } catch (err: any) {
            console.error("Erro atividades:", err);
        } finally {
            setLoadingGrid(false);
        }
    };

    const loadGrid = useCallback(async () => {
        await Promise.all([loadSalasECategorias(selectedEventoId), loadAtividades()]);
    }, [selectedEventoId, dataSelecionada]);

    // ============================
    // Handlers da grade
    // ============================
    const handleCellClick = (salaId: number, slot: string) => {
        // Verificar se já existe atividade nesta célula
        const existing = getAtividadeForCell(salaId, slot);
        if (existing) {
            setEditingAtividade(existing);
        } else {
            setEditingAtividade(null);
            setPresetSalaId(salaId);
            setPresetHoraInicio(slot);
        }
        setAtividadeDialogOpen(true);
    };

    const handleAddAtividade = () => {
        setEditingAtividade(null);
        setPresetSalaId(null);
        setPresetHoraInicio(null);
        setAtividadeDialogOpen(true);
    };

    const getAtividadeForCell = (salaId: number, slot: string): Atividade | undefined => {
        const slotMin = timeToMinutes(slot);
        return atividades.find(a =>
            a.sala_id === salaId &&
            timeToMinutes(a.hora_inicio) <= slotMin &&
            timeToMinutes(a.hora_fim) > slotMin
        );
    };

    const isAtividadeStart = (atividade: Atividade, slot: string): boolean => {
        return formatTime(atividade.hora_inicio) === slot;
    };

    const getAtividadeSpan = (atividade: Atividade): number => {
        const inicio = timeToMinutes(atividade.hora_inicio);
        const fim = timeToMinutes(atividade.hora_fim);
        return Math.max(1, Math.ceil((fim - inicio) / 30));
    };

    // ============================
    // Publicação em lote
    // ============================
    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handlePublishSelected = async (publicar: boolean) => {
        if (selectedIds.size === 0) return;
        try {
            await togglePublicarAtividades(Array.from(selectedIds), publicar);
            setSuccess(`${selectedIds.size} atividade(s) ${publicar ? 'publicadas' : 'despublicadas'}!`);
            setSelectedIds(new Set());
            await loadGrid();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handlePublishAll = async () => {
        const naoPublicadas = atividades.filter(a => !a.publicado);
        if (naoPublicadas.length === 0) {
            setSuccess('Todas as atividades já estão publicadas!');
            return;
        }

        if (!confirm(`Publicar ${naoPublicadas.length} atividade(s) deste dia?`)) return;

        try {
            await togglePublicarAtividades(naoPublicadas.map(a => a.id), true);
            setSuccess(`${naoPublicadas.length} atividade(s) publicadas!`);
            await loadGrid();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ============================
    // Render helpers
    // ============================
    const renderAtividadeCard = (atividade: Atividade) => {
        // Buscar configuração dinâmica da categoria (do banco de dados)
        const catInfo = categorias.find(c => c.nome === atividade.categoria);
        const cardCor = catInfo?.cor || '#1E3A5F';
        const cardIcone = catInfo?.icone || '📋';
        const isSelected = selectedIds.has(atividade.id);
        const isRascunho = !atividade.publicado;

        return (
            <Box
                sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: isRascunho ? alpha(cardCor, 0.05) : alpha(cardCor, 0.12),
                    borderLeft: `5px solid ${cardCor}`,
                    border: isRascunho ? `1px dashed ${alpha(cardCor, 0.5)}` : 'none',
                    borderLeftWidth: 5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    opacity: isRascunho ? 0.85 : 1,
                    boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(cardCor, 0.25)}`,
                        transform: 'translateY(-1px)',
                        zIndex: 3,
                        opacity: 1
                    },
                }}
            >
                {/* Cabeçalho do Card: Tag + Checkbox */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            bgcolor: alpha(cardCor, 0.2), 
                            color: cardCor, 
                            px: 0.8, 
                            py: 0.2, 
                            borderRadius: 1, 
                            fontSize: '0.6rem', 
                            fontWeight: 'bold',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                        }}
                    >
                        {atividade.categoria}
                    </Typography>
                    
                    <Checkbox
                        size="small"
                        checked={isSelected}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(atividade.id);
                        }}
                        sx={{
                            p: 0,
                            color: alpha(cardCor, 0.4),
                            '&.Mui-checked': { color: theme.palette.primary.main },
                            '&:hover': { bgcolor: alpha(cardCor, 0.1) }
                        }}
                    />
                </Box>

                {/* Título */}
                <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                        mb: 0.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.8rem'
                    }}
                >
                    <span style={{ fontSize: '1rem' }}>{cardIcone}</span>
                    <span>{atividade.titulo}</span>
                </Typography>

                {/* Palestrante */}
                {atividade.palestrante && (
                    <Typography
                        variant="caption"
                        sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.7rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            mb: 0.5
                        }}
                    >
                        <strong>👤</strong> {atividade.palestrante}
                    </Typography>
                )}

                {/* Descrição (Preview de 2 linhas) */}
                {atividade.descricao && (
                    <Typography
                        variant="caption"
                        sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.65rem', 
                            fontStyle: 'italic',
                            lineHeight: 1.2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1,
                            opacity: 0.8
                        }}
                    >
                        {atividade.descricao}
                    </Typography>
                )}

                {/* Rodapé: Horário + Status */}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="caption"
                        sx={{ 
                            bgcolor: 'rgba(0,0,0,0.05)', 
                            px: 0.6, 
                            py: 0.1, 
                            borderRadius: 0.5,
                            color: 'text.secondary', 
                            fontSize: '0.65rem',
                            fontWeight: 500
                        }}
                    >
                        {formatTime(atividade.hora_inicio)} – {formatTime(atividade.hora_fim)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isRascunho ? (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 'bold', fontSize: '0.6rem' }}>
                                RASCUNHO
                            </Typography>
                        ) : (
                            <Visibility sx={{ fontSize: 14, color: 'success.main' }} />
                        )}
                    </Box>
                </Box>
            </Box>
        );
    };

    // ============================
    // RENDER PRINCIPAL
    // ============================
    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                    📅 Cronograma do Evento
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedEventoId > 0 && (
                        <>
                            <Tooltip title="Exportar Agenda em PDF">
                                <IconButton 
                                    onClick={async () => {
                                        try {
                                            const todasAtv = await fetchAtividadesByEventoEData(selectedEventoId);
                                            exportarCronogramaPDF(selectedEvento?.nome || 'Evento', datas, salas, todasAtv);
                                        } catch (err: any) {
                                            setError('Erro ao exportar PDF: ' + err.message);
                                        }
                                    }} 
                                    color="secondary"
                                >
                                    <PictureAsPdf />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Exportar Agenda em Excel">
                                <IconButton 
                                    onClick={async () => {
                                        try {
                                            const todasAtv = await fetchAtividadesByEventoEData(selectedEventoId);
                                            exportarCronogramaExcel(selectedEvento?.nome || 'Evento', salas, todasAtv);
                                        } catch (err: any) {
                                            setError('Erro ao exportar Excel: ' + err.message);
                                        }
                                    }} 
                                    color="success"
                                >
                                    <FileDownload />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title="Atualizar dados">
                        <IconButton
                            onClick={() => { loadEventos(); if (selectedEventoId) loadGrid(); }}
                            color="primary"
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monte a grade de horários e salas do seu evento
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Seletor de Evento + Gerenciar Salas */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    label="Selecione o Evento"
                    select
                    size="small"
                    value={selectedEventoId || ''}
                    onChange={(e) => handleSelectEvento(Number(e.target.value))}
                    sx={{ minWidth: 300 }}
                >
                    {eventos.map((evt) => (
                        <MenuItem key={evt.id} value={evt.id}>
                            {evt.nome}
                        </MenuItem>
                    ))}
                </TextField>

                {selectedEventoId > 0 && (
                    <>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Category />}
                            onClick={() => setCategoriasDialogOpen(true)}
                        >
                            Categorias ({categorias.length})
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Settings />}
                            onClick={() => setSalasDialogOpen(true)}
                        >
                            Salas ({salas.length})
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={handleAddAtividade}
                        >
                            Nova Atividade
                        </Button>
                    </>
                )}
            </Box>

            {/* Loading */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Conteúdo da grade */}
            {selectedEvento && !loading && (
                <>
                    {/* Abas por Data */}
                    {datas.length > 0 && (
                        <Paper sx={{ mb: 2 }}>
                            <Tabs
                                value={tabIndex}
                                onChange={(_, v) => setTabIndex(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTab-root': {
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        minHeight: 48,
                                    },
                                }}
                            >
                                {datas.map((data, idx) => (
                                    <Tab
                                        key={data}
                                        label={formatDataCurta(data)}
                                        id={`tab-dia-${idx}`}
                                    />
                                ))}
                            </Tabs>
                        </Paper>
                    )}

                    {/* Barra de ações em lote */}
                    {atividades.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                                label={`${atividades.length} atividade(s)`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                icon={<Visibility sx={{ fontSize: 14 }} />}
                                label={`${atividades.filter(a => a.publicado).length} publicadas`}
                                size="small"
                                color="success"
                                variant="outlined"
                            />

                            {selectedIds.size > 0 && (
                                <>
                                    <Chip
                                        label={`${selectedIds.size} selecionadas`}
                                        size="small"
                                        color="info"
                                    />
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<Publish />}
                                        onClick={() => handlePublishSelected(true)}
                                    >
                                        Publicar
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityOff />}
                                        onClick={() => handlePublishSelected(false)}
                                    >
                                        Despublicar
                                    </Button>
                                </>
                            )}

                            <Box sx={{ flex: 1 }} />
                            <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<Publish />}
                                onClick={handlePublishAll}
                            >
                                Publicar Todas do Dia
                            </Button>
                        </Box>
                    )}

                    {/* GRADE VISUAL */}
                    {loadingGrid ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : salas.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                Nenhuma sala cadastrada para este evento.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Settings />}
                                onClick={() => setSalasDialogOpen(true)}
                            >
                                Cadastrar Salas
                            </Button>
                        </Paper>
                    ) : (
                        <Paper
                            sx={{
                                overflow: 'auto',
                                maxHeight: 'calc(100vh - 380px)',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box
                                component="table"
                                sx={{
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    minWidth: salas.length * 160 + 80,
                                    '& th, & td': {
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        p: 0.5,
                                        verticalAlign: 'top',
                                    },
                                    '& th': {
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 2,
                                        textAlign: 'center',
                                        p: 1,
                                    },
                                }}
                            >
                                {/* Cabeçalho: Horário | Sala1 | Sala2 | ... */}
                                <thead>
                                    <tr>
                                        <Box
                                            component="th"
                                            sx={{
                                                width: 70,
                                                minWidth: 70,
                                                bgcolor: `${theme.palette.primary.dark} !important`,
                                            }}
                                        >
                                            Horário
                                        </Box>
                                        {salas.map(sala => (
                                            <Box component="th" key={sala.id} sx={{ minWidth: 150 }}>
                                                {sala.nome}
                                                {sala.capacidade && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ display: 'block', opacity: 0.7, fontWeight: 'normal' }}
                                                    >
                                                        {sala.capacidade} lug.
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </tr>
                                </thead>

                                {/* Linhas: slots de 30 min */}
                                <tbody>
                                    {slots.map((slot) => {
                                        // Verificar se alguma sala tem atividade render neste slot
                                        const isFullHour = slot.endsWith(':00');

                                        return (
                                            <tr key={slot}>
                                                {/* Coluna de horário */}
                                                <Box
                                                    component="td"
                                                    sx={{
                                                        textAlign: 'center',
                                                        fontWeight: isFullHour ? 'bold' : 'normal',
                                                        color: isFullHour ? 'text.primary' : 'text.disabled',
                                                        fontSize: '0.75rem',
                                                        bgcolor: isFullHour
                                                            ? alpha(theme.palette.primary.main, 0.04)
                                                            : 'transparent',
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    {slot}
                                                </Box>

                                                {/* Células das salas */}
                                                {salas.map((sala) => {
                                                    const atividade = getAtividadeForCell(sala.id, slot);

                                                    if (atividade) {
                                                        // Se é o início da atividade → renderizar card com rowSpan
                                                        if (isAtividadeStart(atividade, slot)) {
                                                            const span = getAtividadeSpan(atividade);
                                                            return (
                                                                <Box
                                                                    component="td"
                                                                    key={sala.id}
                                                                    rowSpan={span}
                                                                    onClick={() => handleCellClick(sala.id, slot)}
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        p: '2px !important',
                                                                        verticalAlign: 'stretch !important' as any,
                                                                    }}
                                                                >
                                                                    {renderAtividadeCard(atividade)}
                                                                </Box>
                                                            );
                                                        }
                                                        // Se está no meio de uma atividade → célula já coberta por rowSpan
                                                        return null;
                                                    }

                                                    // Célula vazia → clicável para criar
                                                    return (
                                                        <Box
                                                            component="td"
                                                            key={sala.id}
                                                            onClick={() => handleCellClick(sala.id, slot)}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                minHeight: 28,
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                                },
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Box>
                        </Paper>
                    )}

                </>
            )}

            {/* ====== DIALOGS ====== */}
            {selectedEvento && (
                <>
                    <SalasDialog
                        open={salasDialogOpen}
                        onClose={() => setSalasDialogOpen(false)}
                        eventoId={selectedEventoId}
                        eventoNome={selectedEvento.nome}
                        onSalasChanged={loadGrid}
                    />
                    <CategoriasDialog
                        open={categoriasDialogOpen}
                        onClose={() => setCategoriasDialogOpen(false)}
                        eventoId={selectedEventoId}
                        onUpdate={loadGrid}
                    />
                    <AtividadeDialog
                        key={`atividade-form-${selectedEventoId}-${atividadeDialogOpen}`} // KEY RESET: Força reconstrução ao abrir ou trocar evento
                        open={atividadeDialogOpen}
                        onClose={() => {
                            setAtividadeDialogOpen(false);
                            setEditingAtividade(null);
                        }}
                        eventoId={selectedEventoId}
                        salas={salas}
                        dataSelecionada={dataSelecionada}
                        atividadesDoDia={atividades}
                        categorias={categorias}
                        editingAtividade={editingAtividade}
                        presetSalaId={presetSalaId}
                        presetHoraInicio={presetHoraInicio}
                        onUpdate={loadGrid}
                    />
                </>
            )}
        </Box>
    );
}
