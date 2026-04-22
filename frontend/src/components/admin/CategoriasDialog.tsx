import { 
    Dialog, DialogTitle, DialogContent, Box, TextField, 
    Button, IconButton, Typography, List, ListItem, 
    ListItemText, ListItemSecondaryAction, Divider,
    Grid, MenuItem, Tooltip
} from '@mui/material';
import { Close, Add, Delete, Category, Edit, Save, Clear } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { fetchCategoriasByEvento, createCategoria, updateCategoria, deleteCategoria } from '../../services/cronogramaService';
import type { Categoria } from '../../types';

interface CategoriasDialogProps {
    open: boolean;
    onClose: () => void;
    eventoId: number;
    onUpdate: () => void;
}

const ICON_OPTIONS = ['📋', '🎤', '🍽️', '🙏', '⛪', '💡', '🎨', '🎵', '🏥', '🚌', '⭐', '⏰', '🎬', '📸', '🤝', '🙌', '✝️', '📖', '🕯️', '🍷', '📣', '⚽', '🎒', '🛡️'];

const IMAGE_ICONS = [
    { nome: 'Almoço', path: '/img/icones/almoco.png' },
    { nome: 'Bíblia', path: '/img/icones/biblia.png' },
    { nome: 'Calendário', path: '/img/icones/calendario.png' },
    { nome: 'Credenciamento', path: '/img/icones/credenciamento.png' },
    { nome: 'Lanche', path: '/img/icones/lanche.png' },
    { nome: 'Conferência', path: '/img/icones/conferencia-on-line.png' },
    { nome: 'Fim', path: '/img/icones/terminar.png' },
    { nome: 'Complacente', path: '/img/icones/complacente.png' },
];

const COLOR_OPTIONS = [
    { label: 'Azul', hex: '#1565C0' },
    { label: 'Vermelho', hex: '#C62828' },
    { label: 'Verde', hex: '#2E7D32' },
    { label: 'Laranja', hex: '#EF6C00' },
    { label: 'Roxo', hex: '#6A1B9A' },
    { label: 'Cinza', hex: '#455A64' },
    { label: 'Rosa', hex: '#AD1457' },
    { label: 'Preto', hex: '#212121' }
];

export default function CategoriasDialog({ open, onClose, eventoId, onUpdate }: CategoriasDialogProps) {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Estados do Form
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newNome, setNewNome] = useState('');
    const [newCor, setNewCor] = useState('#1565C0');
    const [newIcone, setNewIcone] = useState('📋');

    useEffect(() => {
        if (open) {
            load();
            resetForm();
        }
    }, [open, eventoId]);

    const load = async () => {
        try {
            const data = await fetchCategoriasByEvento(eventoId);
            setCategorias(data);
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewNome('');
        setNewCor('#1565C0');
        setNewIcone('📋');
    };

    const handleSave = async () => {
        if (!newNome) return;
        setLoading(true);
        try {
            if (editingId) {
                await updateCategoria(editingId, {
                    nome: newNome,
                    cor: newCor,
                    icone: newIcone
                });
            } else {
                await createCategoria({
                    nome: newNome,
                    cor: newCor,
                    icone: newIcone,
                    evento_id: eventoId
                });
            }
            resetForm();
            load();
            onUpdate();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar categoria. Verifique se o nome já existe.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (cat: Categoria) => {
        setEditingId(cat.id);
        setNewNome(cat.nome);
        setNewCor(cat.cor);
        setNewIcone(cat.icone);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Excluir esta categoria?')) return;
        try {
            await deleteCategoria(id);
            load();
            onUpdate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category color="primary" />
                    <Typography variant="h6" fontWeight="bold">Configurar Categorias</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {/* Form Novo/Edição */}
                <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff' }}>
                    <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block', mb: 2, textTransform: 'uppercase' }}>
                        {editingId ? 'Editando Categoria' : 'Nova Categoria'}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nome da Categoria"
                                fullWidth
                                size="small"
                                value={newNome}
                                onChange={(e) => setNewNome(e.target.value)}
                                placeholder="Ex: Workshop, Missa..."
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField
                                select
                                label="Ícone"
                                fullWidth
                                size="small"
                                value={newIcone}
                                onChange={(e) => setNewIcone(e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                <optgroup label="EMOJIS">
                                    {ICON_OPTIONS.map(icon => (
                                        <option key={icon} value={icon}>{icon} Emoji</option>
                                    ))}
                                </optgroup>
                                <optgroup label="IMAGENS">
                                    {IMAGE_ICONS.map(img => (
                                        <option key={img.path} value={img.path}>{img.nome}</option>
                                    ))}
                                </optgroup>
                            </TextField>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField
                                select
                                label="Cor"
                                fullWidth
                                size="small"
                                value={newCor}
                                onChange={(e) => setNewCor(e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                {COLOR_OPTIONS.map(c => (
                                    <option key={c.hex} value={c.hex}>
                                        {c.label}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                variant="contained" 
                                fullWidth 
                                startIcon={editingId ? <Save /> : <Add />}
                                onClick={handleSave}
                                disabled={loading || !newNome}
                                sx={{ 
                                    bgcolor: '#1e3a5f',
                                    color: 'white !important', // Força cor branca
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: '#2a528a' },
                                    textTransform: 'none',
                                    py: 1
                                }}
                            >
                                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
                            </Button>
                            {editingId && (
                                <Button 
                                    variant="outlined" 
                                    color="inherit"
                                    onClick={resetForm}
                                    startIcon={<Clear />}
                                >
                                    Cancelar
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </Box>

                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, px: 1 }}>
                    Categorias do Evento ({(categorias?.length || 0)})
                </Typography>

                {/* Lista */}
                <List dense>
                    {(categorias || []).map((cat) => (
                        <ListItem 
                            key={cat.id} 
                            sx={{ 
                                bgcolor: editingId === cat.id ? 'primary.50' : 'grey.50', 
                                mb: 1, 
                                borderRadius: 2,
                                border: editingId === cat.id ? '1px solid #1e3a5f' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Box sx={{ 
                                width: 36, 
                                height: 36, 
                                borderRadius: 1.5, 
                                bgcolor: `${cat.cor || '#1e3a5f'}15`, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                mr: 2,
                                border: `1px solid ${cat.cor || '#1e3a5f'}`,
                                overflow: 'hidden'
                            }}>
                                {cat.icone?.startsWith('/') ? (
                                    <img src={cat.icone} alt={cat.nome} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                                ) : (
                                    <Typography fontSize={20}>{cat.icone || '📋'}</Typography>
                                )}
                            </Box>
                            <ListItemText 
                                primary={cat.nome} 
                                primaryTypographyProps={{ fontWeight: 'bold', color: editingId === cat.id ? 'primary.main' : 'text.primary' }}
                                secondary={cat.cor}
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Editar">
                                    <IconButton edge="end" size="small" onClick={() => handleEditClick(cat)} sx={{ mr: 1 }}>
                                        <Edit fontSize="small" color="primary" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                    <IconButton edge="end" size="small" onClick={() => handleDelete(cat.id)}>
                                        <Delete fontSize="small" color="error" />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
}
