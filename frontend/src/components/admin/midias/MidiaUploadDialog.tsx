import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    Typography,
    Alert,
    CircularProgress,
    IconButton,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { CategoriaArquivo, MidiaQuotaInfo } from '../../../types';
import {
    detectCategoria,
    validarArquivo,
    formatBytes,
    midiaService,
    MAX_FILE_SIZE_LIMITS
} from '../../../services/midiaService';

interface MidiaUploadDialogProps {
    open: boolean;
    onClose: () => void;
    eventoId: number;
    quota: MidiaQuotaInfo;
    onUploadSuccess: () => void;
    userId?: string;
}

const CATEGORIAS_OPCOES: { value: CategoriaArquivo; label: string; icon: string }[] = [
    { value: 'planilhas', label: 'Planilhas', icon: '📊' },
    { value: 'foto', label: 'Fotos & Imagens', icon: '🖼️' },
    { value: 'video', label: 'Vídeos', icon: '🎬' },
    { value: 'audio', label: 'Gravações de Áudio', icon: '🎙️' },
    { value: 'documentos', label: 'Documentos', icon: '📁' },
];

export const MidiaUploadDialog: React.FC<MidiaUploadDialogProps> = ({
    open,
    onClose,
    eventoId,
    quota,
    onUploadSuccess,
    userId
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [titulo, setTitulo] = useState('');
    const [categoria, setCategoria] = useState<CategoriaArquivo>('documentos');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Limpa o estado ao abrir/fechar
    useEffect(() => {
        if (!open) {
            setFile(null);
            setTitulo('');
            setCategoria('documentos');
            setValidationError(null);
            setUploading(false);
            setDragOver(false);
        }
    }, [open]);

    // Trata seleção de arquivo
    const handleFileSelect = (selectedFile: File) => {
        setValidationError(null);
        setFile(selectedFile);

        // Auto-sugerir categoria
        const autoCat = detectCategoria(selectedFile);
        setCategoria(autoCat);

        // Auto-sugerir título amigável (sem extensão)
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
        const formattedTitle = nameWithoutExt
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        setTitulo(formattedTitle);

        // Validação imediata
        const res = validarArquivo(selectedFile, quota.usadoBytes);
        if (!res.valido) {
            setValidationError(res.erro || 'Arquivo inválido.');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        // Re-validação final
        const res = validarArquivo(file, quota.usadoBytes);
        if (!res.valido) {
            setValidationError(res.erro || 'Arquivo inválido.');
            return;
        }

        setUploading(true);
        setValidationError(null);

        const result = await midiaService.uploadArquivo(
            eventoId,
            file,
            titulo || file.name,
            categoria,
            userId
        );

        setUploading(false);

        if (result.success) {
            onUploadSuccess();
            onClose();
        } else {
            setValidationError(result.error || 'Falha ao realizar upload.');
        }
    };

    return (
        <Dialog open={open} onClose={uploading ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUploadIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                        Enviar Arquivo ou Mídia
                    </Typography>
                </Box>
                <IconButton onClick={onClose} disabled={uploading} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Zona de Drop / Seleção de Arquivo */}
                <Box
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        border: '2px dashed',
                        borderColor: dragOver ? 'primary.main' : file ? 'success.main' : 'divider',
                        bgcolor: dragOver ? 'action.hover' : file ? 'success.50' : 'background.default',
                        borderRadius: 2.5,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        mb: 2.5,
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.xlsx,.doc,.xls,.jpg,.jpeg,.png,.webp,.mp4,.mp3,.aac,.m4a"
                    />

                    {file ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: 44, color: 'success.main' }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                                {file.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip label={formatBytes(file.size)} size="small" variant="outlined" />
                                <Chip label={file.type || 'Arquivo'} size="small" color="primary" variant="outlined" />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Clique para substituir o arquivo selecionado
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.7 }} />
                            <Typography variant="subtitle1" fontWeight={600}>
                                Arraste e solte o arquivo aqui
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ou clique para selecionar do seu dispositivo
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Formatos: PDF, DOCX, XLSX, JPG, PNG, MP4 (≤50MB), MP3/AAC (≤25MB)
                            </Typography>
                            <Typography variant="caption" color="error" fontWeight={600}>
                                🚫 Arquivos .WAV não são permitidos
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Exibição de Erro de Validação */}
                {validationError && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                        {validationError}
                    </Alert>
                )}

                {/* Formulário de Metadados */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Título amigável para o arquivo"
                        placeholder="Ex: Roteiro da Liturgia de Sábado"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={uploading}
                        helperText="Identificação clara que será exibida para a coordenação"
                    />

                    <TextField
                        select
                        label="Categoria do arquivo"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as CategoriaArquivo)}
                        fullWidth
                        size="small"
                        disabled={uploading}
                    >
                        {CATEGORIAS_OPCOES.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{option.icon}</span>
                                    <span>{option.label}</span>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={uploading} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!file || !!validationError || uploading}
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    sx={{ px: 3, fontWeight: 700 }}
                >
                    {uploading ? 'Enviando...' : 'Salvar Arquivo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
