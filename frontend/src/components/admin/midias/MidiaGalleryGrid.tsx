import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    IconButton,
    Chip,
    Button,
    Tooltip,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
    CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import type { EventoArquivo, CategoriaArquivo } from '../../../types';
import { formatBytes, midiaService } from '../../../services/midiaService';

interface MidiaGalleryGridProps {
    arquivos: EventoArquivo[];
    loading: boolean;
    onItemDeleted: () => void;
    onItemUpdated?: () => void;
    onOpenUpload: () => void;
}

export const MidiaGalleryGrid: React.FC<MidiaGalleryGridProps> = ({
    arquivos,
    loading,
    onItemDeleted,
    onItemUpdated,
    onOpenUpload
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [fileToDelete, setFileToDelete] = useState<EventoArquivo | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [fileToEdit, setFileToEdit] = useState<{ id: string; titulo: string; nome_original: string } | null>(null);
    const [editTitleInput, setEditTitleInput] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Preferência de visualização persistida no localStorage
    const [viewMode, setViewMode] = useState<'lista' | 'grade'>(() => {
        const saved = localStorage.getItem('midias_view_mode');
        return (saved === 'grade' || saved === 'lista') ? saved : 'lista';
    });

    const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, nextMode: 'lista' | 'grade' | null) => {
        if (nextMode !== null) {
            setViewMode(nextMode);
            localStorage.setItem('midias_view_mode', nextMode);
        }
    };

    // Filtros
    const filteredArquivos = arquivos.filter(item => {
        const matchesCategory = selectedCategory === 'todos' ||
            item.categoria === selectedCategory ||
            (selectedCategory === 'planilhas' && item.categoria === 'cronograma') ||
            (selectedCategory === 'documentos' && (item.categoria === 'outros' || item.categoria === 'liturgia'));
        const matchesSearch = !searchTerm ||
            item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nome_original.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Abrir Modal de Edição de Título
    const handleOpenEdit = (item: EventoArquivo) => {
        setFileToEdit({ id: item.id, titulo: item.titulo, nome_original: item.nome_original });
        setEditTitleInput(item.titulo);
    };

    // Salvar Novo Título
    const handleSaveTitle = async () => {
        if (!fileToEdit || !editTitleInput.trim()) return;
        setSavingEdit(true);
        const result = await midiaService.updateTitulo(fileToEdit.id, editTitleInput.trim());
        setSavingEdit(false);

        if (result.success) {
            setSnackbar({ open: true, message: 'Título atualizado com sucesso!', severity: 'success' });
            setFileToEdit(null);
            if (onItemUpdated) {
                onItemUpdated();
            } else {
                onItemDeleted();
            }
        } else {
            setSnackbar({ open: true, message: result.error || 'Erro ao atualizar título.', severity: 'error' });
        }
    };

    // Download Direto de Arquivo
    const handleDownload = async (item: EventoArquivo) => {
        try {
            setDownloadingId(item.id);
            setSnackbar({ open: true, message: `Baixando "${item.nome_original}"...`, severity: 'info' });

            const response = await fetch(item.storage_url);
            if (!response.ok) throw new Error('Falha na resposta do servidor.');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = item.nome_original || item.titulo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            setSnackbar({ open: true, message: `Download concluído: "${item.nome_original}"`, severity: 'success' });
        } catch (err) {
            console.warn('Erro no download via blob, acionando fallback de abertura:', err);
            // Fallback direto via tag âncora
            const link = document.createElement('a');
            link.href = item.storage_url;
            link.download = item.nome_original || item.titulo;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setDownloadingId(null);
        }
    };

    // Confirmação de Exclusão
    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;
        setDeleting(true);
        const result = await midiaService.deleteArquivo(fileToDelete);
        setDeleting(false);
        setFileToDelete(null);

        if (result.success) {
            setSnackbar({ open: true, message: 'Arquivo excluído com sucesso.', severity: 'success' });
            onItemDeleted();
        } else {
            setSnackbar({ open: true, message: result.error || 'Erro ao excluir arquivo.', severity: 'error' });
        }
    };

    // Ícone por categoria
    const getCategoryIcon = (categoria: CategoriaArquivo, mimetype: string) => {
        if (categoria === 'planilhas' || categoria === 'cronograma' || mimetype.includes('spreadsheet') || mimetype.includes('excel') || mimetype.includes('csv')) {
            return <TableChartIcon sx={{ color: '#059669', fontSize: 22 }} />;
        }
        if (categoria === 'foto' || mimetype.startsWith('image/')) {
            return <ImageIcon sx={{ color: '#0284c7', fontSize: 22 }} />;
        }
        if (categoria === 'video' || mimetype.startsWith('video/')) {
            return <VideoLibraryIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />;
        }
        if (categoria === 'audio' || mimetype.startsWith('audio/')) {
            return <AudioFileIcon sx={{ color: '#f59e0b', fontSize: 22 }} />;
        }
        if (mimetype === 'application/pdf') {
            return <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 22 }} />;
        }
        return <DescriptionIcon sx={{ color: '#64748b', fontSize: 22 }} />;
    };

    // Tag amigável
    const getCategoryBadge = (categoria: CategoriaArquivo) => {
        const map: Record<string, { label: string; color: any }> = {
            planilhas: { label: 'Planilha', color: 'success' },
            cronograma: { label: 'Planilha', color: 'success' },
            foto: { label: 'Foto', color: 'primary' },
            video: { label: 'Vídeo', color: 'warning' },
            audio: { label: 'Áudio', color: 'info' },
            documentos: { label: 'Documento', color: 'default' },
            liturgia: { label: 'Documento', color: 'default' },
            outros: { label: 'Documento', color: 'default' }
        };
        const cfg = map[categoria] || map.documentos;
        return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" sx={{ fontSize: '0.72rem', height: 20 }} />;
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Barra de Filtros, Pesquisa e Seletor de Modo */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                    mb: 2.5
                }}
            >
                {/* Abas de Categorias */}
                <Tabs
                    value={selectedCategory}
                    onChange={(_, val) => setSelectedCategory(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 40,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            py: 0.5,
                            px: 1.8
                        }
                    }}
                >
                    <Tab label={`Todos (${arquivos.length})`} value="todos" />
                    <Tab label="Planilhas" value="planilhas" />
                    <Tab label="Fotos" value="foto" />
                    <Tab label="Vídeos" value="video" />
                    <Tab label="Áudios" value="audio" />
                    <Tab label="Documentos" value="documentos" />
                </Tabs>

                {/* Controles da Direita: Busca + Alternador de Visualização */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por título ou arquivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: { xs: '100%', sm: 260 } }}
                    />

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                        aria-label="modo de visualização"
                        sx={{ bgcolor: 'background.paper' }}
                    >
                        <Tooltip title="Exibição em Lista (Windows Explorer)">
                            <ToggleButton value="lista" aria-label="lista">
                                <ViewListIcon fontSize="small" />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Exibição em Mini-Cards">
                            <ToggleButton value="grade" aria-label="grade">
                                <GridViewIcon fontSize="small" />
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>
                </Stack>
            </Box>

            {/* Lista Vazia */}
            {!loading && filteredArquivos.length === 0 && (
                <Box
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}
                >
                    <FolderOpenIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Nenhum arquivo encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        {searchTerm || selectedCategory !== 'todos'
                            ? 'Nenhum resultado corresponde aos filtros selecionados.'
                            : 'Nenhum arquivo foi adicionado para este evento ainda.'}
                    </Typography>
                    <Button variant="contained" onClick={onOpenUpload} sx={{ fontWeight: 600 }}>
                        Enviar Primeiro Arquivo
                    </Button>
                </Box>
            )}

            {/* MODO 1: LISTA DETALHADA (Estilo Windows Explorer) */}
            {viewMode === 'lista' && filteredArquivos.length > 0 && (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflowX: 'auto'
                    }}
                >
                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ width: 44, py: 1.2, pl: 2 }}></TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Nome / Título</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.2, width: 120 }}>Categoria</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.2, width: 100, textAlign: 'right' }}>Tamanho</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.2, width: 130, textAlign: 'center' }}>Data de Envio</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.2, width: 110, textAlign: 'center', pr: 2 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredArquivos.map((item) => (
                                <TableRow
                                    key={item.id}
                                    hover
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        transition: 'background-color 0.15s ease'
                                    }}
                                >
                                    {/* Ícone */}
                                    <TableCell sx={{ pl: 2, py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {getCategoryIcon(item.categoria, item.mimetype)}
                                        </Box>
                                    </TableCell>

                                    {/* Nome e Título */}
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {item.titulo}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.nome_original}
                                        </Typography>
                                    </TableCell>

                                    {/* Categoria */}
                                    <TableCell sx={{ py: 1 }}>
                                        {getCategoryBadge(item.categoria)}
                                    </TableCell>

                                    {/* Tamanho */}
                                    <TableCell sx={{ py: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatBytes(item.tamanho_bytes)}
                                        </Typography>
                                    </TableCell>

                                    {/* Data */}
                                    <TableCell sx={{ py: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(item.created_at).toLocaleDateString('pt-BR')} {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </TableCell>

                                    {/* Ações */}
                                    <TableCell sx={{ py: 1, textAlign: 'center', pr: 2, whiteSpace: 'nowrap' }}>
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <Tooltip title="Editar título">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenEdit(item)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Baixar arquivo no computador">
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleDownload(item)}
                                                    disabled={downloadingId === item.id}
                                                >
                                                    {downloadingId === item.id ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Visualizar em nova aba">
                                                <IconButton
                                                    size="small"
                                                    component="a"
                                                    href={item.storage_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    color="default"
                                                >
                                                    <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir arquivo">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setFileToDelete(item)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* MODO 2: MINI-CARDS HORIZONTAIS */}
            {viewMode === 'grade' && filteredArquivos.length > 0 && (
                <Grid container spacing={1.5}>
                    {filteredArquivos.map((item) => {
                        const fileExt = item.nome_original.split('.').pop()?.toUpperCase() || 'ARQ';

                        return (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                        }
                                    }}
                                >
                                    {/* Box do Ícone Compacto */}
                                    <Box
                                        sx={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 1.5,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        {getCategoryIcon(item.categoria, item.mimetype)}
                                    </Box>

                                    {/* Textos Centrais */}
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Tooltip title={item.titulo} placement="top">
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={600}
                                                noWrap
                                                sx={{ color: 'text.primary', lineHeight: 1.2 }}
                                            >
                                                {item.titulo}
                                            </Typography>
                                        </Tooltip>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ display: 'block', mt: 0.3 }}
                                        >
                                            .{fileExt} • {formatBytes(item.tamanho_bytes)} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </Box>

                                    {/* Ações Compactas */}
                                    <Stack direction="row" spacing={0.2} sx={{ flexShrink: 0 }}>
                                        <Tooltip title="Editar título">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEdit(item)}
                                                sx={{ p: 0.6 }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Baixar arquivo">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleDownload(item)}
                                                disabled={downloadingId === item.id}
                                                sx={{ p: 0.6 }}
                                            >
                                                {downloadingId === item.id ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Abrir em nova aba">
                                            <IconButton
                                                size="small"
                                                component="a"
                                                href={item.storage_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                color="default"
                                                sx={{ p: 0.6 }}
                                            >
                                                <OpenInNewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Excluir">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setFileToDelete(item)}
                                                sx={{ p: 0.6 }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={!!fileToDelete} onClose={() => !deleting && setFileToDelete(null)}>
                <DialogTitle fontWeight={700}>
                    Confirmar Exclusão de Arquivo
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Tem certeza que deseja excluir o arquivo <strong>{fileToDelete?.titulo}</strong>?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        O arquivo físico será removido do armazenamento e o espaço de {fileToDelete ? formatBytes(fileToDelete.tamanho_bytes) : ''} será liberado na cota do evento.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setFileToDelete(null)} disabled={deleting} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Edição de Título */}
            <Dialog
                open={!!fileToEdit}
                onClose={() => !savingEdit && setFileToEdit(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle fontWeight={700}>
                    Editar Título do Arquivo
                </DialogTitle>
                <DialogContent>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Arquivo original: <strong>{fileToEdit?.nome_original}</strong>
                    </Typography>
                    <TextField
                        autoFocus
                        label="Título do Arquivo"
                        fullWidth
                        size="small"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        disabled={savingEdit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveTitle();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setFileToEdit(null)} disabled={savingEdit} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveTitle}
                        variant="contained"
                        disabled={!editTitleInput.trim() || savingEdit}
                    >
                        {savingEdit ? 'Salvando...' : 'Salvar Título'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
