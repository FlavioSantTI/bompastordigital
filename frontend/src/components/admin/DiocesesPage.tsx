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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface Diocese {
    id: number;
    nome_completo: string;
    bispo: string;
    uf: string;
    sede_id?: number;
}

const UF_OPTIONS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function DiocesesPage() {
    const [dioceses, setDioceses] = useState<Diocese[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDiocese, setEditingDiocese] = useState<Diocese | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nome_completo: '',
        bispo: '',
        uf: '',
    });

    useEffect(() => {
        fetchDioceses();
    }, []);

    const fetchDioceses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('dioceses')
            .select('*')
            .order('nome_completo');

        if (error) {
            setError('Erro ao carregar dioceses: ' + error.message);
        } else {
            setDioceses(data || []);
        }
        setLoading(false);
    };

    const handleOpenDialog = (diocese?: Diocese) => {
        if (diocese) {
            setEditingDiocese(diocese);
            setFormData({
                nome_completo: diocese.nome_completo,
                bispo: diocese.bispo || '',
                uf: diocese.uf,
            });
        } else {
            setEditingDiocese(null);
            setFormData({ nome_completo: '', bispo: '', uf: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDiocese(null);
        setFormData({ nome_completo: '', bispo: '', uf: '' });
        setError('');
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!formData.nome_completo || !formData.uf) {
            setError('Nome da diocese e UF são obrigatórios');
            return;
        }

        console.log('Enviando dados da diocese:', formData);

        if (editingDiocese) {
            // Update
            const { error } = await supabase
                .from('dioceses')
                .update(formData)
                .eq('id', editingDiocese.id);

            if (error) {
                console.error('Erro ao atualizar diocese:', error);
                setError('Erro ao atualizar: ' + error.message);
            } else {
                setSuccess('Diocese atualizada com sucesso!');
                handleCloseDialog();
                fetchDioceses();
            }
        } else {
            // Insert
            const { data, error } = await supabase
                .from('dioceses')
                .insert([formData])
                .select();

            if (error) {
                console.error('Erro ao criar diocese:', error);
                setError('Erro ao criar: ' + error.message);
            } else {
                console.log('Diocese criada:', data);
                setSuccess('Diocese criada com sucesso!');
                handleCloseDialog();
                fetchDioceses();
            }
        }
    };

    const handleDelete = async (id: number, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a diocese "${nome}"?`)) {
            return;
        }

        const { error } = await supabase
            .from('dioceses')
            .delete()
            .eq('id', id);

        if (error) {
            setError('Erro ao excluir: ' + error.message);
        } else {
            setSuccess('Diocese excluída com sucesso!');
            fetchDioceses();
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Gerenciar Dioceses
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Nova Diocese
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
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
                                <TableCell><strong>Nome Completo</strong></TableCell>
                                <TableCell><strong>Bispo</strong></TableCell>
                                <TableCell><strong>UF</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dioceses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        Nenhuma diocese cadastrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dioceses.map((diocese) => (
                                    <TableRow key={diocese.id}>
                                        <TableCell>{diocese.nome_completo}</TableCell>
                                        <TableCell>{diocese.bispo || '-'}</TableCell>
                                        <TableCell>{diocese.uf}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(diocese)}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(diocese.id, diocese.nome_completo)}
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
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingDiocese ? 'Editar Diocese' : 'Nova Diocese'}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Nome Completo"
                            fullWidth
                            required
                            value={formData.nome_completo}
                            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                            placeholder="Ex: Arquidiocese de São Paulo"
                        />
                        <TextField
                            label="Bispo"
                            fullWidth
                            value={formData.bispo}
                            onChange={(e) => setFormData({ ...formData, bispo: e.target.value })}
                            placeholder="Ex: Dom Fulano de Tal"
                        />
                        <TextField
                            label="UF"
                            fullWidth
                            required
                            select
                            value={formData.uf}
                            onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                        >
                            <MenuItem value="">Selecione...</MenuItem>
                            {UF_OPTIONS.map((uf) => (
                                <MenuItem key={uf} value={uf}>
                                    {uf}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingDiocese ? 'Salvar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
