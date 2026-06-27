/**
 * PalestrantesPage — Gerenciamento de Palestrantes (Admin)
 * Módulo Palestrantes v5.3
 */
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
    Avatar,
    Tooltip,
    InputAdornment,
    Grid,
} from '@mui/material';
import { Add, Edit, Delete, Search, CloudUpload, RecordVoiceOver, Language, Instagram, LinkedIn, Twitter } from '@mui/icons-material';
import type { Palestrante } from '../../types';
import {
    fetchPalestrantes,
    createPalestrante,
    updatePalestrante,
    deletePalestrante,
    uploadFotoPalestrante,
} from '../../services/palestranteService';

export default function PalestrantesPage() {
    const [palestrantes, setPalestrantes] = useState<Palestrante[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State do Dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPalestrante, setEditingPalestrante] = useState<Palestrante | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingFoto, setUploadingFoto] = useState(false);

    // Feedback
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        bio: '',
        foto_url: '',
        instagram: '',
        linkedin: '',
        twitter: '',
        website: '',
    });

    // Confirmation delete
    const [deleteTarget, setDeleteTarget] = useState<Palestrante | null>(null);

    useEffect(() => {
        loadPalestrantes();
    }, []);

    const loadPalestrantes = async () => {
        setLoading(true);
        try {
            const data = await fetchPalestrantes();
            setPalestrantes(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (palestrante?: Palestrante) => {
        if (palestrante) {
            setEditingPalestrante(palestrante);
            setFormData({
                nome: palestrante.nome || '',
                email: palestrante.email || '',
                bio: palestrante.bio || '',
                foto_url: palestrante.foto_url || '',
                instagram: palestrante.instagram || '',
                linkedin: palestrante.linkedin || '',
                twitter: palestrante.twitter || '',
                website: palestrante.website || '',
            });
        } else {
            setEditingPalestrante(null);
            setFormData({
                nome: '',
                email: '',
                bio: '',
                foto_url: '',
                instagram: '',
                linkedin: '',
                twitter: '',
                website: '',
            });
        }
        setError('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPalestrante(null);
        setError('');
    };

    const handleFotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingFoto(true);
        setError('');
        try {
            const publicUrl = await uploadFotoPalestrante(file);
            setFormData(prev => ({ ...prev, foto_url: publicUrl }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingFoto(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.nome.trim()) {
            setError('O nome do palestrante é obrigatório.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                nome: formData.nome.trim(),
                email: formData.email.trim() || null,
                bio: formData.bio.trim() || null,
                foto_url: formData.foto_url.trim() || null,
                instagram: formData.instagram.trim() || null,
                linkedin: formData.linkedin.trim() || null,
                twitter: formData.twitter.trim() || null,
                website: formData.website.trim() || null,
            };

            if (editingPalestrante) {
                await updatePalestrante(editingPalestrante.id, payload);
                setSuccess('Palestrante atualizado com sucesso!');
            } else {
                await createPalestrante(payload);
                setSuccess('Palestrante cadastrado com sucesso!');
            }

            handleCloseDialog();
            loadPalestrantes();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setSaving(true);
        try {
            await deletePalestrante(deleteTarget.id, deleteTarget.foto_url);
            setSuccess(`Palestrante "${deleteTarget.nome}" excluído com sucesso.`);
            setDeleteTarget(null);
            loadPalestrantes();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredPalestrantes = palestrantes.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <RecordVoiceOver sx={{ fontSize: 36, color: 'primary.main' }} />
                    <Typography variant="h4" fontWeight="bold">
                        Palestrantes
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Novo Palestrante
                </Button>
            </Box>

            {/* Alert Feedback */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Busca e Filtros */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar palestrante por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 360 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {/* Tabela de Palestrantes */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell width={60}><strong>Foto</strong></TableCell>
                                <TableCell><strong>Nome</strong></TableCell>
                                <TableCell><strong>E-mail</strong></TableCell>
                                <TableCell><strong>Biografia</strong></TableCell>
                                <TableCell><strong>Redes</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPalestrantes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {searchTerm ? 'Nenhum palestrante encontrado para a busca.' : 'Nenhum palestrante cadastrado ainda.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPalestrantes.map((p) => (
                                    <TableRow key={p.id} hover>
                                        <TableCell>
                                            <Avatar
                                                src={p.foto_url || undefined}
                                                alt={p.nome}
                                                sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 'bold' }}
                                            >
                                                {p.nome.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {p.nome}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.email || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 250 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {p.bio || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {p.instagram && (
                                                    <Tooltip title={`Instagram: ${p.instagram}`}>
                                                        <IconButton size="small" component="a" href={p.instagram.startsWith('http') ? p.instagram : `https://instagram.com/${p.instagram.replace('@', '')}`} target="_blank">
                                                            <Instagram fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {p.linkedin && (
                                                    <Tooltip title={`LinkedIn: ${p.linkedin}`}>
                                                        <IconButton size="small" component="a" href={p.linkedin.startsWith('http') ? p.linkedin : `https://linkedin.com/in/${p.linkedin}`} target="_blank">
                                                            <LinkedIn fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {p.website && (
                                                    <Tooltip title={`Website: ${p.website}`}>
                                                        <IconButton size="small" component="a" href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank">
                                                            <Language fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton color="primary" onClick={() => handleOpenDialog(p)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton color="error" onClick={() => setDeleteTarget(p)}>
                                                    <Delete fontSize="small" />
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

            {/* Dialog Form Criar/Editar */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {editingPalestrante ? 'Editar Palestrante' : 'Novo Palestrante'}
                </DialogTitle>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                        {/* Avatar / Upload de Foto */}
                        <Grid item xs={12} sm={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar
                                src={formData.foto_url || undefined}
                                sx={{ width: 100, height: 100, mb: 1.5, bgcolor: 'primary.main', fontSize: 36 }}
                            >
                                {formData.nome ? formData.nome.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                            <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                startIcon={uploadingFoto ? <CircularProgress size={16} /> : <CloudUpload />}
                                disabled={uploadingFoto}
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            >
                                {uploadingFoto ? 'Enviando...' : 'Carregar Foto'}
                                <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleFotoUpload} />
                            </Button>
                        </Grid>

                        {/* Dados Principais */}
                        <Grid item xs={12} sm={9}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Nome Completo"
                                    fullWidth
                                    required
                                    size="small"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                />
                                <TextField
                                    label="E-mail de Contato"
                                    fullWidth
                                    type="email"
                                    size="small"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Box>
                        </Grid>

                        {/* Biografia */}
                        <Grid item xs={12}>
                            <TextField
                                label="Mini-Biografia / Perfil"
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Breve currículo ou apresentação do palestrante..."
                            />
                        </Grid>

                        {/* Redes Sociais */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                🌐 Redes Sociais e Links
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Instagram"
                                fullWidth
                                size="small"
                                placeholder="@usuario ou link"
                                value={formData.instagram}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Instagram fontSize="small" /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="LinkedIn"
                                fullWidth
                                size="small"
                                placeholder="perfil-linkedin ou link"
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><LinkedIn fontSize="small" /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Twitter / X"
                                fullWidth
                                size="small"
                                placeholder="@usuario"
                                value={formData.twitter}
                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Twitter fontSize="small" /></InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Website / Blog"
                                fullWidth
                                size="small"
                                placeholder="https://..."
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Language fontSize="small" /></InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} variant="text" color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={saving} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>
                        {saving ? 'Salvando...' : (editingPalestrante ? 'Salvar Alterações' : 'Cadastrar')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Confirmar Exclusão */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir o palestrante <strong>{deleteTarget?.nome}</strong>?
                        Os vínculos dele com atividades também serão removidos.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={saving}>
                        {saving ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
