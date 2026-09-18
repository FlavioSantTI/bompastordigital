/**
 * BadgeSourcePicker.tsx
 * Componente de seleção de evento + fonte de dados (origem) para geração de crachás.
 * Nível 1: Selecionar Evento
 * Nível 2: Selecionar Origem (Inscritos, Equipes, Círculos, Palestrantes)
 */
import {
    Box, FormControl, InputLabel, Select, MenuItem,
    ToggleButtonGroup, ToggleButton, Typography, Tooltip,
} from '@mui/material';
import { People, Groups, GroupWork, RecordVoiceOver } from '@mui/icons-material';
import type { BadgeSourceEntity } from '../../../types/badge';
import { BADGE_SOURCE_OPTIONS } from '../../../types/badge';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
}

interface BadgeSourcePickerProps {
    eventos: Evento[];
    eventoSelecionado: number | '';
    onEventoChange: (eventoId: number | '') => void;
    sourceSelecionado: BadgeSourceEntity;
    onSourceChange: (source: BadgeSourceEntity) => void;
}

const SOURCE_ICONS: Record<BadgeSourceEntity, React.ReactNode> = {
    INSCRITO: <People />,
    EQUIPE: <Groups />,
    CIRCULO: <GroupWork />,
    PALESTRANTE: <RecordVoiceOver />,
};

export default function BadgeSourcePicker({
    eventos,
    eventoSelecionado,
    onEventoChange,
    sourceSelecionado,
    onSourceChange,
}: BadgeSourcePickerProps) {
    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Seletor de Evento */}
            <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Selecionar Evento</InputLabel>
                <Select
                    value={eventoSelecionado}
                    label="Selecionar Evento"
                    onChange={(e) => onEventoChange(e.target.value as number)}
                >
                    {eventos.map((ev) => (
                        <MenuItem key={ev.id} value={ev.id}>
                            {ev.nome} — {ev.data_inicio.split('-').reverse().join('/')}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Seletor de Fonte de Dados */}
            {eventoSelecionado && (
                <Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5, display: 'block' }}
                    >
                        Origem dos dados:
                    </Typography>
                    <ToggleButtonGroup
                        value={sourceSelecionado}
                        exclusive
                        onChange={(_e, value) => {
                            if (value) onSourceChange(value as BadgeSourceEntity);
                        }}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                textTransform: 'none',
                                px: 2,
                                gap: 0.5,
                            },
                        }}
                    >
                        {BADGE_SOURCE_OPTIONS.map((opt) => (
                            <ToggleButton key={opt.value} value={opt.value}>
                                <Tooltip title={opt.description} arrow>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {SOURCE_ICONS[opt.value]}
                                        <Typography variant="body2">{opt.label}</Typography>
                                    </Box>
                                </Tooltip>
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>
            )}
        </Box>
    );
}
