/**
 * CrachasPage.tsx
 * Página principal do módulo de impressão de crachás.
 * Permite selecionar um evento, filtrar inscritos e gerar o PDF.
 */
import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, IconButton,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    Checkbox, FormControl, InputLabel, Select, MenuItem,
    Tooltip,
} from '@mui/material';
import { Print, Search, SelectAll, ClearAll, Badge } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import CrachaPreviewDialog from './CrachaPreviewDialog';
import { type CrachaData } from './CrachaTemplate';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
}

export default function CrachasPage() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [eventoSelecionado, setEventoSelecionado] = useState<number | ''>('');

    const [participantes, setParticipantes] = useState<CrachaData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [busca, setBusca] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    // ── Carrega lista de eventos na montagem ──────────
    useEffect(() => {
        supabase
            .from('eventos')
            .select('id, nome, data_inicio')
            .order('data_inicio', { ascending: false })
            .then(({ data }) => setEventos((data as Evento[]) ?? []));
    }, []);

    // ── Carrega inscritos quando o evento muda ────────
    useEffect(() => {
        if (!eventoSelecionado) {
            setParticipantes([]);
            setSelecionados(new Set());
            return;
        }
        const loadParticipantes = async () => {
            try {
                setLoading(true);
                setError('');
                const { data, error: rpcErr } = await supabase
                    .rpc('get_inscritos_para_cracha' as any, { p_evento_id: eventoSelecionado });
                if (rpcErr) throw rpcErr;
                setParticipantes((data as CrachaData[]) ?? []);
                setSelecionados(new Set());
            } catch (err: any) {
                setError('Não foi possível carregar os inscritos: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        loadParticipantes();
    }, [eventoSelecionado]);

    // ── Filtragem por busca ───────────────────────────
    const filtrados = participantes.filter((p) =>
        p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        p.paroquia?.toLowerCase().includes(busca.toLowerCase()) ||
        p.diocese?.toLowerCase().includes(busca.toLowerCase())
    );

    // ── Seleção de checkbox ───────────────────────────
    const toggleSelecionado = (key: string) => {
        setSelecionados((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const selecionarTodos = () =>
        setSelecionados(new Set(filtrados.map(chave)));

    const limparSelecao = () => setSelecionados(new Set());

    const chave = (p: CrachaData) => `${p.inscricao_id}-${p.tipo}`;

    const participantesSelecionados = participantes.filter((p) =>
        selecionados.has(chave(p))
    );

    return (
        <Box>
            {/* ── Cabeçalho ───────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                    variant="h4"
                    color="primary"
                    sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}
                >
                    Impressão de Crachás
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<Print />}
                    disabled={selecionados.size === 0}
                    onClick={() => setPreviewOpen(true)}
                >
                    Gerar Crachás ({selecionados.size})
                </Button>
            </Box>

            {/* ── Filtros ─────────────────────────────── */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                    <InputLabel>Selecionar Evento</InputLabel>
                    <Select
                        value={eventoSelecionado}
                        label="Selecionar Evento"
                        onChange={(e) => setEventoSelecionado(e.target.value as number)}
                    >
                        {eventos.map((ev) => (
                            <MenuItem key={ev.id} value={ev.id}>
                                {ev.nome} — {new Date(ev.data_inicio).toLocaleDateString('pt-BR')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    placeholder="Buscar nome, paróquia ou diocese..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start"><Search /></InputAdornment>
                            ),
                        },
                    }}
                />

                <Tooltip title="Selecionar todos os filtrados">
                    <IconButton onClick={selecionarTodos} disabled={filtrados.length === 0}>
                        <SelectAll />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Limpar seleção">
                    <IconButton onClick={limparSelecao} disabled={selecionados.size === 0}>
                        <ClearAll />
                    </IconButton>
                </Tooltip>
            </Paper>

            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ── Tabela de inscritos ──────────────────── */}
            <TableContainer component={Paper} elevation={1}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={
                                        selecionados.size > 0 &&
                                        selecionados.size < filtrados.length
                                    }
                                    checked={
                                        filtrados.length > 0 &&
                                        filtrados.every((p) => selecionados.has(chave(p)))
                                    }
                                    onChange={(e) =>
                                        e.target.checked ? selecionarTodos() : limparSelecao()
                                    }
                                />
                            </TableCell>
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Paróquia</strong></TableCell>
                            <TableCell><strong>Diocese</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!eventoSelecionado ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    <Badge sx={{ fontSize: 40, mb: 1, display: 'block' }} />
                                    Selecione um evento para ver os inscritos.
                                </TableCell>
                            </TableRow>
                        ) : loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filtrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Nenhum inscrito encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtrados.map((p) => {
                                const k = chave(p);
                                return (
                                    <TableRow
                                        key={k}
                                        hover
                                        selected={selecionados.has(k)}
                                        onClick={() => toggleSelecionado(k)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={selecionados.has(k)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelecionado(k)} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{p.nome}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={p.tipo === 'esposo' ? 'Esposo' : 'Esposa'}
                                                size="small"
                                                color={p.tipo === 'esposo' ? 'primary' : 'secondary'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.paroquia || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {p.diocese || '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Modal de Preview ─────────────────────── */}
            {previewOpen && (
                <CrachaPreviewDialog
                    open={previewOpen}
                    participantes={participantesSelecionados}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </Box>
    );
}
