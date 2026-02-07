import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { CloudUpload, Delete, Visibility, InsertDriveFile, Image as ImageIcon } from '@mui/icons-material';
import { comprovanteService } from '../../services/comprovanteService';
import type { UploadResult } from '../../services/comprovanteService';

interface ComprovantesManagerProps {
    inscricaoId: number | string;
    readOnly?: boolean;
    onUploadSuccess?: () => void;
    onComprovantesChange?: (count: number) => void;
}

interface Comprovante {
    id: string;
    url_storage: string;
    path_storage: string;
    tipo_mimetype: string;
    created_at: string;
}

export default function ComprovantesManager({ inscricaoId, readOnly = false, onUploadSuccess, onComprovantesChange }: ComprovantesManagerProps) {
    const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadComprovantes();
    }, [inscricaoId]);

    const loadComprovantes = async () => {
        try {
            setLoading(true);
            const data = await comprovanteService.getComprovantes(inscricaoId);
            if (Array.isArray(data)) {
                setComprovantes(data as Comprovante[]);
                if (onComprovantesChange) onComprovantesChange(data.length);
            } else {
                setComprovantes([]);
                console.error('Dados de comprovantes inválidos:', data);
            }
        } catch (error) {
            console.error('Erro ao carregar comprovantes:', error);
            setComprovantes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        setUploading(true);
        setError('');

        try {
            const result: UploadResult = await comprovanteService.uploadComprovante(inscricaoId, file);

            if (result.success) {
                await loadComprovantes();
                if (onUploadSuccess) onUploadSuccess();
            } else {
                setError(result.error || 'Erro ao fazer upload.');
            }
        } catch (err) {
            setError('Erro inesperado ao enviar arquivo.');
        } finally {
            setUploading(false);
            // reset do input
            event.target.value = '';
        }
    };

    const handleDelete = async (comprovante: Comprovante) => {
        if (!confirm('Tem certeza que deseja excluir este comprovante permanentemente?')) return;

        const result = await comprovanteService.deleteComprovante(comprovante.id, comprovante.path_storage);
        if (result.success) {
            loadComprovantes();
        } else {
            alert('Erro ao excluir: ' + result.error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    📎 Comprovantes de Pagamento
                </Typography>

                {!readOnly && (
                    <Button
                        component="label"
                        variant="contained"
                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                        disabled={uploading}
                        size="small"
                    >
                        {uploading ? 'Enviando...' : 'Novo Upload'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf, .jpg, .jpeg, .png"
                            onChange={handleFileChange}
                        />
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : comprovantes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                    Nenhum comprovante anexado.
                </Typography>
            ) : (
                <List dense>
                    {comprovantes.map((comp) => (
                        <ListItem key={comp.id} divider>
                            <Box sx={{ mr: 2 }}>
                                {comp.tipo_mimetype.includes('pdf') ? (
                                    <InsertDriveFile color="error" />
                                ) : (
                                    <ImageIcon color="primary" />
                                )}
                            </Box>
                            <ListItemText
                                primary={comp.tipo_mimetype.split('/')[1].toUpperCase()}
                                secondary={`Enviado em: ${formatDate(comp.created_at)}`}
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Visualizar">
                                    <IconButton
                                        edge="end"
                                        onClick={() => window.open(comp.url_storage, '_blank')}
                                        sx={{ mr: 1 }}
                                    >
                                        <Visibility />
                                    </IconButton>
                                </Tooltip>
                                {!readOnly && (
                                    <Tooltip title="Excluir">
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDelete(comp)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}
