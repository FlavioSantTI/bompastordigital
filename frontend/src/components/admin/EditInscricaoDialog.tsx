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
    Divider,
    Alert,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Chip,
    Autocomplete,
    CircularProgress,
    Paper,
} from '@mui/material';
import { supabase } from '../../lib/supabase';

interface Pessoa {
    id: string;
    cpf: string;
    nome: string;
    nascimento: string;
    email?: string;
    telefone?: string;
}

interface Municipio {
    codigo_tom: number;
    nome_ibge: string;
    uf: string;
    diocese_id?: number;
}

interface Inscricao {
    id: number;
    evento_id: number;
    esposo_id: string;
    esposa_id: string;
    diocese_id?: number;
    status?: string;
    dados_conjuntos?: any;
    esposo?: Pessoa;
    esposa?: Pessoa;
}

interface EditInscricaoDialogProps {
    open: boolean;
    inscricao: Inscricao | null;
    eventos: { id: number; nome: string }[];
    onClose: () => void;
    onSave: () => void;
}

const PASTORAIS_OPCOES = [
    'Pastoral Familiar',
    'Pastoral da Criança',
    'Pastoral da Juventude',
    'Pastoral da Saúde',
    'Pastoral Social',
    'Liturgia',
    'Música',
    'Catequese',
    'Outras',
];

export default function EditInscricaoDialog({ open, inscricao, eventos, onClose, onSave }: EditInscricaoDialogProps) {
    const [error, setError] = useState('');
    const [eventoId, setEventoId] = useState(0);

    // Dados do Esposo
    const [esposoNome, setEsposoNome] = useState('');
    const [esposoCpf, setEsposoCpf] = useState('');
    const [esposoNascimento, setEsposoNascimento] = useState('');
    const [esposoEmail, setEsposoEmail] = useState('');
    const [esposoTelefone, setEsposoTelefone] = useState('');

    // Dados da Esposa
    const [esposaNome, setEsposaNome] = useState('');
    const [esposaCpf, setEsposaCpf] = useState('');
    const [esposaNascimento, setEsposaNascimento] = useState('');
    const [esposaEmail, setEsposaEmail] = useState('');
    const [esposaTelefone, setEsposaTelefone] = useState('');

    // Município e Diocese
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [loadingMunicipios, setLoadingMunicipios] = useState(false);
    const [inputMunicipio, setInputMunicipio] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
    const [dioceseNome, setDioceseNome] = useState('');

    // Dados Pastorais/Conjugais Completos
    const [paroquia, setParoquia] = useState('');
    const [paroco, setParoco] = useState('');
    const [endereco, setEndereco] = useState('');
    const [novaUniao, setNovaUniao] = useState(false);
    const [membroPasfam, setMembroPasfam] = useState(false);
    const [pastorais, setPastorais] = useState<string[]>([]);
    const [necessitaHospedagem, setNecessitaHospedagem] = useState(false);
    const [restricoesAlimentares, setRestricoesAlimentares] = useState('');
    const [observacoes, setObservacoes] = useState('');

    useEffect(() => {
        if (inscricao) {
            setEventoId(inscricao.evento_id);

            // Esposo
            setEsposoNome(inscricao.esposo?.nome || '');
            setEsposoCpf(inscricao.esposo?.cpf || '');
            setEsposoNascimento(inscricao.esposo?.nascimento || '');
            setEsposoEmail(inscricao.esposo?.email || '');
            setEsposoTelefone(inscricao.esposo?.telefone || '');

            // Esposa
            setEsposaNome(inscricao.esposa?.nome || '');
            setEsposaCpf(inscricao.esposa?.cpf || '');
            setEsposaNascimento(inscricao.esposa?.nascimento || '');
            setEsposaEmail(inscricao.esposa?.email || '');
            setEsposaTelefone(inscricao.esposa?.telefone || '');

            // Carregar município atual
            loadCurrentMunicipio(inscricao.diocese_id);

            // Dados Pastorais/Conjugais
            setParoquia(inscricao.dados_conjuntos?.paroquia || '');
            setParoco(inscricao.dados_conjuntos?.paroco || '');
            setEndereco(inscricao.dados_conjuntos?.endereco || '');
            setNovaUniao(inscricao.dados_conjuntos?.nova_uniao || false);
            setMembroPasfam(inscricao.dados_conjuntos?.membro_pasfam || false);
            setPastorais(inscricao.dados_conjuntos?.pastorais || []);
            setNecessitaHospedagem(inscricao.dados_conjuntos?.necessita_hospedagem || false);
            setRestricoesAlimentares(inscricao.dados_conjuntos?.restricoes_alimentares || '');
            setObservacoes(inscricao.dados_conjuntos?.observacoes || '');
        }
    }, [inscricao]);

    const loadCurrentMunicipio = async (dioceseId?: number) => {
        if (!dioceseId) return;

        // Buscar município pela diocese
        const { data: municipio } = await supabase
            .from('municipios')
            .select('codigo_tom, nome_ibge, uf, diocese_id')
            .eq('diocese_id', dioceseId)
            .limit(1)
            .single();

        if (municipio) {
            setSelectedMunicipio(municipio);
            setInputMunicipio(`${municipio.nome_ibge} - ${municipio.uf}`);
            fetchDiocese(municipio.diocese_id);
        }
    };

    const searchMunicipios = async (searchText: string) => {
        if (searchText.length < 2) return;

        setLoadingMunicipios(true);
        const { data } = await supabase
            .from('municipios')
            .select('codigo_tom, nome_ibge, uf, diocese_id')
            .or(`nome_ibge.ilike.%${searchText}%,uf.ilike.%${searchText}%`)
            .order('nome_ibge')
            .limit(50);

        setMunicipios(data || []);
        setLoadingMunicipios(false);
    };

    const fetchDiocese = async (dioceseId?: number) => {
        if (!dioceseId) {
            setDioceseNome('');
            return;
        }

        const { data } = await supabase
            .from('dioceses')
            .select('nome_completo, bispo')
            .eq('id', dioceseId)
            .single();

        if (data) {
            setDioceseNome(data.nome_completo + (data.bispo ? ` - ${data.bispo}` : ''));
        }
    };

    const handleSave = async () => {
        if (!inscricao) return;

        setError('');

        try {
            // 1. Atualizar dados do esposo
            const { error: esposoError } = await supabase
                .from('pessoas')
                .update({
                    nome: esposoNome,
                    nascimento: esposoNascimento,
                    email: esposoEmail,
                    telefone: esposoTelefone.replace(/\D/g, ''),
                })
                .eq('id', inscricao.esposo_id);

            if (esposoError) throw esposoError;

            // 2. Atualizar dados da esposa
            const { error: esposaError } = await supabase
                .from('pessoas')
                .update({
                    nome: esposaNome,
                    nascimento: esposaNascimento,
                    email: esposaEmail,
                    telefone: esposaTelefone.replace(/\D/g, ''),
                })
                .eq('id', inscricao.esposa_id);

            if (esposaError) throw esposaError;

            // 3. Atualizar dados da inscrição com TODOS os campos
            const { error: inscricaoError } = await supabase
                .from('inscricoes')
                .update({
                    evento_id: eventoId,
                    diocese_id: selectedMunicipio?.diocese_id || null,
                    dados_conjuntos: {
                        paroquia,
                        paroco,
                        endereco,
                        nova_uniao: novaUniao,
                        membro_pasfam: membroPasfam,
                        pastorais,
                        necessita_hospedagem: necessitaHospedagem,
                        restricoes_alimentares: restricoesAlimentares || null,
                        observacoes: observacoes || null,
                    },
                })
                .eq('id', inscricao.id);

            if (inscricaoError) throw inscricaoError;

            onSave();
            onClose();
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError('Erro ao salvar alterações: ' + err.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <DialogTitle>
                ✏️ Editar Inscrição Completa
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Evento */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            📅 Evento
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            value={eventoId}
                            onChange={(e) => setEventoId(Number(e.target.value))}
                        >
                            {eventos.map((evento) => (
                                <MenuItem key={evento.id} value={evento.id}>
                                    {evento.nome}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <Divider />

                    {/* Dados do Esposo */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            👨 Dados do Esposo
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Nome Completo"
                                value={esposoNome}
                                onChange={(e) => setEsposoNome(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="CPF"
                                value={esposoCpf}
                                disabled
                                helperText="CPF não pode ser alterado"
                            />
                            <TextField
                                fullWidth
                                type="date"
                                label="Data de Nascimento"
                                value={esposoNascimento}
                                onChange={(e) => setEsposoNascimento(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                type="email"
                                label="E-mail"
                                value={esposoEmail}
                                onChange={(e) => setEsposoEmail(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Telefone"
                                value={esposoTelefone}
                                onChange={(e) => setEsposoTelefone(e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Dados da Esposa */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            👩 Dados da Esposa
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Nome Completo"
                                value={esposaNome}
                                onChange={(e) => setEsposaNome(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="CPF"
                                value={esposaCpf}
                                disabled
                                helperText="CPF não pode ser alterado"
                            />
                            <TextField
                                fullWidth
                                type="date"
                                label="Data de Nascimento"
                                value={esposaNascimento}
                                onChange={(e) => setEsposaNascimento(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                type="email"
                                label="E-mail"
                                value={esposaEmail}
                                onChange={(e) => setEsposaEmail(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Telefone"
                                value={esposaTelefone}
                                onChange={(e) => setEsposaTelefone(e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Localização */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            📍 Localização
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Autocomplete
                                options={municipios}
                                getOptionLabel={(option) => `${option.nome_ibge} - ${option.uf}`}
                                loading={loadingMunicipios}
                                value={selectedMunicipio}
                                onChange={(_, newValue) => {
                                    setSelectedMunicipio(newValue);
                                    if (newValue) {
                                        fetchDiocese(newValue.diocese_id);
                                    } else {
                                        setDioceseNome('');
                                    }
                                }}
                                inputValue={inputMunicipio}
                                onInputChange={(_, newInputValue, reason) => {
                                    setInputMunicipio(newInputValue);
                                    if (reason === 'input') {
                                        searchMunicipios(newInputValue);
                                    }
                                }}
                                filterOptions={(x) => x}
                                isOptionEqualToValue={(option, value) => option.codigo_tom === value.codigo_tom}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cidade / Município"
                                        placeholder="Digite o nome da cidade..."
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingMunicipios ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            {dioceseNome && (
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50', borderColor: 'success.main' }}>
                                    <Typography variant="subtitle2" color="success.dark">
                                        ✅ Diocese Identificada:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {dioceseNome}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </Box>

                    <Divider />

                    {/* Dados Pastorais e Conjugais */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                            ⛪ Dados Pastorais e Conjugais
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Paróquia / Comunidade"
                                value={paroquia}
                                onChange={(e) => setParoquia(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Nome do Pároco"
                                value={paroco}
                                onChange={(e) => setParoco(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Endereço Completo"
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                            />

                            {/* Checkboxes */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={novaUniao}
                                            onChange={(e) => setNovaUniao(e.target.checked)}
                                        />
                                    }
                                    label="Segunda União"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={membroPasfam}
                                            onChange={(e) => setMembroPasfam(e.target.checked)}
                                        />
                                    }
                                    label="Membro da Pastoral Familiar"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={necessitaHospedagem}
                                            onChange={(e) => setNecessitaHospedagem(e.target.checked)}
                                        />
                                    }
                                    label="Necessita Hospedagem"
                                />
                            </Box>

                            {/* Pastorais */}
                            {membroPasfam && (
                                <Autocomplete
                                    multiple
                                    options={PASTORAIS_OPCOES}
                                    value={pastorais}
                                    onChange={(_, newValue) => setPastorais(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Pastorais em que atua"
                                            placeholder="Selecione..."
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option}
                                                {...getTagProps({ index })}
                                                key={option}
                                            />
                                        ))
                                    }
                                />
                            )}

                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Restrições Alimentares"
                                value={restricoesAlimentares}
                                onChange={(e) => setRestricoesAlimentares(e.target.value)}
                                placeholder="Ex: vegetariano, intolerância a lactose, etc."
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Observações Gerais"
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Informações adicionais relevantes"
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary" size="large">
                    💾 Salvar Todas as Alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
}
