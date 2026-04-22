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
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Alert,
    CircularProgress,
    Divider,
    Autocomplete,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { IMaskInput } from 'react-imask';
import React from 'react';
import { supabase } from '../../lib/supabase';
import { registerByAdmin } from '../../services/registrationService';
import type { TipoInscricao } from '../../types';

// Máscaras
const CPFMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="000.000.000-00"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

const DateMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="00/00/0000"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

const PhoneMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="(00) 00000-0000"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

interface Evento {
    id: number;
    nome: string;
}

interface Diocese {
    id: number;
    nome_completo: string;
}

interface Municipio {
    codigo_tom: number;
    nome_ibge: string | null;
    uf: string | null;
}

interface AdminInscricaoDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

const emptyPessoa = { nome: '', cpf: '', nascimento: '', email: '', telefone: '' };

export default function AdminInscricaoDialog({ open, onClose, onSave }: AdminInscricaoDialogProps) {
    const [tipo, setTipo] = useState<TipoInscricao>('casal');
    const [eventoId, setEventoId] = useState<number>(0);
    const [dioceseId, setDioceseId] = useState<number | null>(null);
    const [pessoa1, setPessoa1] = useState({ ...emptyPessoa });
    const [pessoa2, setPessoa2] = useState({ ...emptyPessoa });
    
    // Dados Conjuntos / Complementares
    const [paroquia, setParoquia] = useState('');
    const [paroco, setParoco] = useState('');
    const [endereco, setEndereco] = useState('');
    const [novaUniao, setNovaUniao] = useState(false);
    const [membroPasfam, setMembroPasfam] = useState(false);
    const [necessitaHospedagem, setNecessitaHospedagem] = useState(false);
    const [restricoesAlimentares, setRestricoesAlimentares] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [eventos, setEventos] = useState<Evento[]>([]);
    const [dioceses, setDioceses] = useState<Diocese[]>([]);
    const [municipioId, setMunicipioId] = useState<number | null>(null);
    const [municipioNome, setMunicipioNome] = useState('');
    const [opcoesMunicipios, setOpcoesMunicipios] = useState<Municipio[]>([]);
    const [inputMunicipio, setInputMunicipio] = useState('');
    const [loadingMunicipio, setLoadingMunicipio] = useState(false);

    useEffect(() => {
        if (open) {
            loadEventos();
            loadDioceses();
            resetForm();
        }
    }, [open]);

    const loadEventos = async () => {
        const { data } = await supabase
            .from('eventos')
            .select('id, nome')
            .order('data_inicio', { ascending: false });
        setEventos(data || []);
    };

    const loadDioceses = async () => {
        const { data } = await supabase
            .from('dioceses')
            .select('id, nome_completo')
            .order('nome_completo');
        setDioceses(data || []);
    };

    const buscarMunicipios = async (texto: string) => {
        if (texto.length < 2) return;
        setLoadingMunicipio(true);
        const { data } = await supabase
            .from('municipios')
            .select('codigo_tom, nome_ibge, uf')
            .or(`nome_ibge.ilike.%${texto}%,uf.ilike.%${texto}%`)
            .order('nome_ibge')
            .limit(50);
        setOpcoesMunicipios(data || []);
        setLoadingMunicipio(false);
    };

    const resetForm = () => {
        setTipo('casal');
        setEventoId(0);
        setDioceseId(null);
        setPessoa1({ ...emptyPessoa });
        setPessoa2({ ...emptyPessoa });
        setParoquia('');
        setParoco('');
        setEndereco('');
        setNovaUniao(false);
        setMembroPasfam(false);
        setNecessitaHospedagem(false);
        setRestricoesAlimentares('');
        setObservacoes('');
        setMunicipioId(null);
        setMunicipioNome('');
        setInputMunicipio('');
        setOpcoesMunicipios([]);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        // Validação mínima (apenas campos NOT NULL do banco)
        if (!pessoa1.nome || !pessoa1.cpf || !pessoa1.nascimento) {
            setError('Preencha pelo menos Nome, CPF e Nascimento da Pessoa 1.');
            return;
        }

        if (pessoa1.cpf.replace(/\D/g, '').length !== 11) {
            setError('CPF da Pessoa 1 está inválido.');
            return;
        }

        if (tipo === 'casal') {
            if (!pessoa2.nome || !pessoa2.cpf || !pessoa2.nascimento) {
                setError('Preencha pelo menos Nome, CPF e Nascimento da Pessoa 2.');
                return;
            }
            if (pessoa2.cpf.replace(/\D/g, '').length !== 11) {
                setError('CPF da Pessoa 2 está inválido.');
                return;
            }
        }

        setLoading(true);
        try {
            const result = await registerByAdmin({
                tipo,
                evento_id: eventoId > 0 ? eventoId : undefined,
                diocese_id: dioceseId || undefined,
                pessoa1,
                pessoa2: tipo === 'casal' ? pessoa2 : undefined,
                dados_conjuntos: {
                    paroquia: paroquia || undefined,
                    paroco: paroco || undefined,
                    endereco: endereco || undefined,
                    nova_uniao: novaUniao,
                    membro_pasfam: membroPasfam,
                    necessita_hospedagem: necessitaHospedagem,
                    restricoes_alimentares: restricoesAlimentares || undefined,
                    observacoes: observacoes || undefined,
                    cidade: municipioNome || undefined,
                },
            });

            if (result.success) {
                setSuccess(result.message);
                onSave();
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError('Erro inesperado: ' + (err?.message || 'Tente novamente.'));
        } finally {
            setLoading(false);
        }
    };

    const updatePessoa = (
        setter: React.Dispatch<React.SetStateAction<typeof emptyPessoa>>,
        field: string,
        value: string
    ) => {
        setter(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                ➕ Nova Inscrição (Admin)
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}

                    {/* Evento e Tipo */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            select
                            label="Evento"
                            value={eventoId}
                            onChange={(e) => setEventoId(Number(e.target.value))}
                            sx={{ flex: '1 1 300px' }}
                            helperText="Opcional"
                            size="small"
                        >
                            <MenuItem value={0}><em>Nenhum (cadastro avulso)</em></MenuItem>
                            {eventos.map((e) => (
                                <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ flex: '0 0 auto' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                Tipo de Inscrição
                            </Typography>
                            <ToggleButtonGroup
                                value={tipo}
                                exclusive
                                onChange={(_, v) => v && setTipo(v)}
                                size="small"
                            >
                                <ToggleButton value="casal">👫 Casal</ToggleButton>
                                <ToggleButton value="individual">👤 Individual</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Pessoa 1 */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                            {tipo === 'casal' ? '👨 Esposo / Pessoa 1' : '👤 Participante'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Nome *"
                                    size="small"
                                    value={pessoa1.nome}
                                    onChange={(e) => updatePessoa(setPessoa1, 'nome', e.target.value)}
                                    sx={{ flex: '1 1 200px' }}
                                />
                                <TextField
                                    label="CPF *"
                                    size="small"
                                    value={pessoa1.cpf}
                                    onChange={(e) => updatePessoa(setPessoa1, 'cpf', e.target.value)}
                                    InputProps={{ inputComponent: CPFMask as any }}
                                    sx={{ flex: '0 0 180px' }}
                                />
                                <TextField
                                    label="Nascimento *"
                                    size="small"
                                    value={pessoa1.nascimento}
                                    onChange={(e) => updatePessoa(setPessoa1, 'nascimento', e.target.value)}
                                    InputProps={{ inputComponent: DateMask as any }}
                                    sx={{ flex: '0 0 150px' }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Email"
                                    size="small"
                                    value={pessoa1.email}
                                    onChange={(e) => updatePessoa(setPessoa1, 'email', e.target.value)}
                                    sx={{ flex: '1 1 200px' }}
                                    helperText="Opcional"
                                />
                                <TextField
                                    label="Telefone"
                                    size="small"
                                    value={pessoa1.telefone}
                                    onChange={(e) => updatePessoa(setPessoa1, 'telefone', e.target.value)}
                                    InputProps={{ inputComponent: PhoneMask as any }}
                                    sx={{ flex: '0 0 180px' }}
                                    helperText="Opcional"
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Pessoa 2 (apenas se casal) */}
                    {tipo === 'casal' && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                                👩 Esposa / Pessoa 2
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                    <TextField
                                        label="Nome *"
                                        size="small"
                                        value={pessoa2.nome}
                                        onChange={(e) => updatePessoa(setPessoa2, 'nome', e.target.value)}
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="CPF *"
                                        size="small"
                                        value={pessoa2.cpf}
                                        onChange={(e) => updatePessoa(setPessoa2, 'cpf', e.target.value)}
                                        InputProps={{ inputComponent: CPFMask as any }}
                                        sx={{ flex: '0 0 180px' }}
                                    />
                                    <TextField
                                        label="Nascimento *"
                                        size="small"
                                        value={pessoa2.nascimento}
                                        onChange={(e) => updatePessoa(setPessoa2, 'nascimento', e.target.value)}
                                        InputProps={{ inputComponent: DateMask as any }}
                                        sx={{ flex: '0 0 150px' }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                    <TextField
                                        label="Email"
                                        size="small"
                                        value={pessoa2.email}
                                        onChange={(e) => updatePessoa(setPessoa2, 'email', e.target.value)}
                                        sx={{ flex: '1 1 200px' }}
                                        helperText="Opcional"
                                    />
                                    <TextField
                                        label="Telefone"
                                        size="small"
                                        value={pessoa2.telefone}
                                        onChange={(e) => updatePessoa(setPessoa2, 'telefone', e.target.value)}
                                        InputProps={{ inputComponent: PhoneMask as any }}
                                        sx={{ flex: '0 0 180px' }}
                                        helperText="Opcional"
                                    />
                                </Box>
                            </Box>
                        </Box>
                    )}

                    <Divider />

                    {/* Dados Complementares (tudo opcional) */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                            📋 Dados Complementares (tudo opcional)
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Autocomplete
                                options={dioceses || []}
                                getOptionLabel={(option) => option.nome_completo}
                                value={(dioceses || []).find(d => d.id === dioceseId) || null}
                                onChange={(_, val) => setDioceseId(val?.id || null)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Diocese" size="small" helperText="Opcional" />
                                )}
                            />

                            {/* Campo Cidade / Município */}
                            <Autocomplete
                                options={opcoesMunicipios}
                                getOptionLabel={(opt) => `${opt.nome_ibge} - ${opt.uf}`}
                                loading={loadingMunicipio}
                                value={opcoesMunicipios.find(m => m.codigo_tom === municipioId) || null}
                                onChange={(_, val) => {
                                    setMunicipioId(val?.codigo_tom || null);
                                    setMunicipioNome(val ? `${val.nome_ibge} - ${val.uf}` : '');
                                }}
                                inputValue={inputMunicipio}
                                onInputChange={(_, v, reason) => {
                                    setInputMunicipio(v);
                                    if (reason === 'input') buscarMunicipios(v);
                                }}
                                filterOptions={(x) => x}
                                isOptionEqualToValue={(opt, val) => opt.codigo_tom === val.codigo_tom}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cidade / Município"
                                        size="small"
                                        helperText="Digite pelo menos 2 letras para buscar (Opcional)"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loadingMunicipio ? <CircularProgress color="inherit" size={16} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Paróquia"
                                    size="small"
                                    value={paroquia}
                                    onChange={(e) => setParoquia(e.target.value)}
                                    sx={{ flex: '1 1 250px' }}
                                    helperText="Opcional"
                                />
                                <TextField
                                    label="Pároco"
                                    size="small"
                                    value={paroco}
                                    onChange={(e) => setParoco(e.target.value)}
                                    sx={{ flex: '1 1 250px' }}
                                    helperText="Opcional"
                                />
                            </Box>
                            
                            <TextField
                                label="Endereço Completo"
                                size="small"
                                multiline
                                rows={2}
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                                fullWidth
                                helperText="Opcional"
                            />

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={novaUniao} onChange={(e) => setNovaUniao(e.target.checked)} />}
                                    label={<Typography variant="body2">Nova União</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={membroPasfam} onChange={(e) => setMembroPasfam(e.target.checked)} />}
                                    label={<Typography variant="body2">Membro Pasfam</Typography>}
                                />
                                <FormControlLabel
                                    control={<Checkbox size="small" checked={necessitaHospedagem} onChange={(e) => setNecessitaHospedagem(e.target.checked)} />}
                                    label={<Typography variant="body2">Necessita Hospedagem</Typography>}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Restrições Alimentares"
                                    size="small"
                                    value={restricoesAlimentares}
                                    onChange={(e) => setRestricoesAlimentares(e.target.value)}
                                    sx={{ flex: '1 1 250px' }}
                                    helperText="Opcional"
                                />
                                <TextField
                                    label="Observações Gerais"
                                    size="small"
                                    multiline
                                    rows={2}
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    sx={{ flex: '1 1 250px' }}
                                    helperText="Opcional"
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Inscrição'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
