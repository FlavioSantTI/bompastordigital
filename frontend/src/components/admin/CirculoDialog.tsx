import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Autocomplete,
    CircularProgress,
    Alert,
    Stack,
    Chip,
    Avatar,
} from '@mui/material';
import {
    Palette,
    PersonSearch,
    Favorite,
    CheckCircle,
} from '@mui/icons-material';
import { createCirculo, updateCirculo, buscarCasalCoordenador, type CasalCoordenadorOpcao } from '../../services/circuloService';
import type { Circulo } from '../../types';

interface CirculoDialogProps {
    open: boolean;
    eventoId: number;
    circulo?: Circulo | null;
    onClose: () => void;
    onSave: () => void;
}

const PALETA_CORES = [
    '#0284C7', // Azul Celeste
    '#0369A1', // Azul Oceano
    '#059669', // Verde Esmeralda
    '#D97706', // Âmbar / Laranja
    '#E11D48', // Vermelho Rosa
    '#7C3AED', // Roxo Violeta
    '#DB2777', // Magenta Pink
    '#4F46E5', // Índigo
    '#0D9488', // Teal / Ciano
    '#475569', // Grafite Escuro
];

export default function CirculoDialog({
    open,
    eventoId,
    circulo,
    onClose,
    onSave,
}: CirculoDialogProps) {
    const isEdit = !!circulo;

    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [cor, setCor] = useState('#0284C7');

    const [casalSelecionado, setCasalSelecionado] = useState<CasalCoordenadorOpcao | null>(null);
    const [opcoesCasais, setOpcoesCasais] = useState<CasalCoordenadorOpcao[]>([]);
    const [loadingCasais, setLoadingCasais] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            if (circulo) {
                setNome(circulo.nome || '');
                setDescricao(circulo.descricao || '');
                setCor(circulo.cor || '#0284C7');

                if (circulo.esposo_coordenador) {
                    const casalEdit: CasalCoordenadorOpcao = {
                        esposo: {
                            id: circulo.esposo_coordenador.id,
                            nome: circulo.esposo_coordenador.nome,
                            telefone: circulo.esposo_coordenador.telefone,
                            email: circulo.esposo_coordenador.email,
                        },
                        esposa: circulo.esposa_coordenador ? {
                            id: circulo.esposa_coordenador.id,
                            nome: circulo.esposa_coordenador.nome,
                            telefone: circulo.esposa_coordenador.telefone,
                            email: circulo.esposa_coordenador.email,
                        } : undefined,
                    };
                    setCasalSelecionado(casalEdit);
                    setOpcoesCasais([casalEdit]);
                } else {
                    setCasalSelecionado(null);
                }
            } else {
                setNome('');
                setDescricao('');
                setCor('#0284C7');
                setCasalSelecionado(null);
                setOpcoesCasais([]);
            }
            setError('');
        }
    }, [open, circulo]);

    const handleSearchCasal = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setOpcoesCasais(casalSelecionado ? [casalSelecionado] : []);
            return;
        }
        setLoadingCasais(true);
        try {
            const resultados = await buscarCasalCoordenador(query, eventoId);
            setOpcoesCasais(resultados);
        } catch (err: any) {
            console.error('Erro ao buscar casais:', err);
        } finally {
            setLoadingCasais(false);
        }
    };

    const handleSave = async () => {
        if (!nome.trim()) {
            setError('Por favor, informe o nome do círculo.');
            return;
        }
        if (!casalSelecionado || !casalSelecionado.esposo) {
            setError('Por favor, selecione um Casal Coordenador elegível.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            if (isEdit && circulo) {
                await updateCirculo(circulo.id, {
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    cor,
                    esposo_coordenador_id: casalSelecionado.esposo.id,
                    esposa_coordenador_id: casalSelecionado.esposa?.id,
                });
            } else {
                await createCirculo({
                    evento_id: eventoId,
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                    cor,
                    esposo_coordenador_id: casalSelecionado.esposo.id,
                    esposa_coordenador_id: casalSelecionado.esposa?.id,
                });
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError('Erro ao salvar círculo: ' + (err.message || 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: cor,
                        display: 'inline-block',
                    }}
                />
                {isEdit ? 'Editar Círculo' : 'Novo Círculo'}
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2.5}>
                    {error && <Alert severity="error">{error}</Alert>}

                    {/* Nome do Círculo */}
                    <TextField
                        label="Nome do Círculo *"
                        fullWidth
                        size="small"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Círculo São José, Círculo Azul..."
                    />

                    {/* Descrição */}
                    <TextField
                        label="Descrição (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Breve resumo ou propósito do círculo..."
                    />

                    {/* Seletor de Cor */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Palette fontSize="small" color="primary" /> Cor do Círculo
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                            {PALETA_CORES.map((c) => (
                                <Box
                                    key={c}
                                    onClick={() => setCor(c)}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: c,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: cor === c ? '3px solid #000' : '2px solid transparent',
                                        transition: 'transform 0.15s ease',
                                        '&:hover': { transform: 'scale(1.15)' },
                                    }}
                                >
                                    {cor === c && <CheckCircle sx={{ color: '#fff', fontSize: 18 }} />}
                                </Box>
                            ))}
                        </Stack>
                        <TextField
                            label="Código Hexadecimal"
                            size="small"
                            value={cor}
                            onChange={(e) => setCor(e.target.value)}
                            sx={{ width: 180 }}
                        />
                    </Box>

                    {/* Autocomplete para Buscar Casal Coordenador */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonSearch fontSize="small" color="primary" /> Casal Coordenador *
                        </Typography>
                        
                        <Autocomplete
                            options={opcoesCasais}
                            getOptionLabel={(option) => {
                                if (option.esposa) {
                                    return `${option.esposo.nome} & ${option.esposa.nome}`;
                                }
                                return `${option.esposo.nome} (Individual)`;
                            }}
                            value={casalSelecionado}
                            onChange={(_, newValue) => setCasalSelecionado(newValue)}
                            onInputChange={(_, newInputValue) => handleSearchCasal(newInputValue)}
                            loading={loadingCasais}
                            noOptionsText="Digite o nome de uma pessoa do cadastro global..."
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Buscar por nome do esposo/esposa..."
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingCasais ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.esposo.id}>
                                    <Stack spacing={0.2} sx={{ py: 0.5 }}>
                                        <Typography variant="body2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Favorite fontSize="inherit" color="error" />
                                            {option.esposa ? `${option.esposo.nome} & ${option.esposa.nome}` : `${option.esposo.nome} (Sem cônjuge identificado)`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {option.paroquia ? `Paróquia: ${option.paroquia}` : 'Sem paróquia especificada'}
                                            {option.esposo.telefone ? ` • Tel: ${option.esposo.telefone}` : ''}
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        />

                        {/* Card Exibitivo do Casal Selecionado */}
                        {casalSelecionado && (
                            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                <Typography variant="caption" color="primary" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                                    CASAL COORDENADOR SELECIONADO:
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: cor, fontSize: 14, fontWeight: 'bold' }}>
                                            {casalSelecionado.esposo.nome.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {casalSelecionado.esposa
                                                    ? `${casalSelecionado.esposo.nome} & ${casalSelecionado.esposa.nome}`
                                                    : `${casalSelecionado.esposo.nome} (Individual)`}
                                            </Typography>
                                            {casalSelecionado.paroquia && (
                                                <Chip label={casalSelecionado.paroquia} size="small" variant="outlined" sx={{ height: 20, fontSize: 10, mt: 0.5 }} />
                                            )}
                                        </Box>
                                    </Stack>

                                    {casalSelecionado.esposa && (
                                        <Button
                                            size="small"
                                            color="secondary"
                                            sx={{ fontSize: 10, textTransform: 'none' }}
                                            onClick={() => setCasalSelecionado({ ...casalSelecionado, esposa: undefined })}
                                        >
                                            Desvincular Esposa
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        <Alert severity="info" sx={{ mt: 1.5, py: 0.5, fontSize: 11 }}>
                            <strong>Regra de Elegibilidade:</strong> Os coordenadores são buscados da base global e <strong>não podem</strong> ter inscrição ativa neste mesmo evento.
                        </Alert>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={saving} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ bgcolor: cor, '&:hover': { opacity: 0.9, bgcolor: cor } }}
                >
                    {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Círculo')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
