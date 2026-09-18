/**
 * BadgeParticipantTable.tsx
 * Tabela de seleção com checkboxes para escolher quais participantes
 * terão crachás gerados. Exibe dados normalizados do CanonicalBadgePayload.
 */
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, Typography, Chip, Box, CircularProgress, IconButton,
    Tooltip, TextField, InputAdornment, Avatar,
} from '@mui/material';
import { Search, SelectAll, ClearAll, Print } from '@mui/icons-material';
import type { CanonicalBadgePayload } from '../../../types/badge';

interface BadgeParticipantTableProps {
    participantes: CanonicalBadgePayload[];
    selecionados: Set<string>;
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onPrintSingle?: (payload: CanonicalBadgePayload) => void;
    loading: boolean;
    busca: string;
    onBuscaChange: (value: string) => void;
    emptyMessage?: string;
}

export default function BadgeParticipantTable({
    participantes,
    selecionados,
    onToggle,
    onSelectAll,
    onClearSelection,
    onPrintSingle,
    loading,
    busca,
    onBuscaChange,
    emptyMessage = 'Selecione um evento e uma origem para ver os participantes.',
}: BadgeParticipantTableProps) {
    // Filtrar por busca
    const filtrados = participantes.filter((p) => {
        const search = busca.toLowerCase();
        return (
            p.primary_name.toLowerCase().includes(search) ||
            p.category_label.toLowerCase().includes(search) ||
            (p.role_badge?.toLowerCase().includes(search) ?? false) ||
            p.footer_metadata.some(
                (m) =>
                    m.label.toLowerCase().includes(search) ||
                    m.value.toLowerCase().includes(search)
            )
        );
    });

    const allSelected = filtrados.length > 0 && filtrados.every((p) => selecionados.has(p.id));
    const someSelected = selecionados.size > 0 && !allSelected;

    return (
        <>
            {/* Barra de busca + ações em lote */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar nome, equipe, círculo..."
                    value={busca}
                    onChange={(e) => onBuscaChange(e.target.value)}
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
                    <span>
                        <IconButton onClick={onSelectAll} disabled={filtrados.length === 0}>
                            <SelectAll />
                        </IconButton>
                    </span>
                </Tooltip>

                <Tooltip title="Limpar seleção">
                    <span>
                        <IconButton onClick={onClearSelection} disabled={selecionados.size === 0}>
                            <ClearAll />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Tabela */}
            <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={someSelected}
                                    checked={allSelected}
                                    onChange={(e) =>
                                        e.target.checked ? onSelectAll() : onClearSelection()
                                    }
                                />
                            </TableCell>
                            <TableCell><strong>Nome</strong></TableCell>
                            <TableCell><strong>Categoria</strong></TableCell>
                            <TableCell><strong>Cargo / Função</strong></TableCell>
                            <TableCell><strong>Informações</strong></TableCell>
                            {onPrintSingle && (
                                <TableCell align="center" sx={{ width: 60 }}>
                                    <strong>⚡</strong>
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                    <CircularProgress size={32} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Carregando participantes...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : filtrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    {participantes.length === 0 ? emptyMessage : 'Nenhum resultado para a busca.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtrados.map((p) => (
                                <TableRow
                                    key={p.id}
                                    hover
                                    selected={selecionados.has(p.id)}
                                    onClick={() => onToggle(p.id)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selecionados.has(p.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => onToggle(p.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {p.avatar_url && (
                                                <Avatar
                                                    src={p.avatar_url}
                                                    sx={{ width: 28, height: 28 }}
                                                />
                                            )}
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {p.primary_name}
                                                </Typography>
                                                {p.secondary_name && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: -0.2 }}>
                                                        {p.secondary_name}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={p.category_label}
                                            size="small"
                                            sx={{
                                                bgcolor: `${p.accent_color}18`,
                                                color: p.accent_color,
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                border: `1px solid ${p.accent_color}40`,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {p.role_badge ? (
                                            <Typography variant="caption" color="text.secondary">
                                                {p.role_badge}
                                            </Typography>
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {p.footer_metadata.slice(0, 2).map((m, i) => (
                                            <Typography key={i} variant="caption" color="text.secondary" display="block">
                                                <strong>{m.label}:</strong> {m.value}
                                            </Typography>
                                        ))}
                                    </TableCell>
                                    {onPrintSingle && (
                                        <TableCell align="center">
                                            <Tooltip title="Imprimir este crachá">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPrintSingle(p);
                                                    }}
                                                >
                                                    <Print fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Contador */}
            {filtrados.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {selecionados.size} de {filtrados.length} selecionado{selecionados.size !== 1 ? 's' : ''}
                    {busca && ` (filtrados de ${participantes.length} total)`}
                </Typography>
            )}
        </>
    );
}
