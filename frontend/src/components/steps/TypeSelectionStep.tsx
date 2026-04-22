import { Box, Typography, Paper, useTheme } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import type { TipoInscricao } from '../../types';

interface TypeOption {
    value: TipoInscricao;
    icon: string;
    title: string;
    description: string;
}

const typeOptions: TypeOption[] = [
    {
        value: 'casal',
        icon: '👫',
        title: 'Inscrição de Casal',
        description: 'Inscreva você e seu cônjuge juntos para o encontro.',
    },
    {
        value: 'individual',
        icon: '👤',
        title: 'Inscrição Individual',
        description: 'Inscreva-se individualmente como participante.',
    },
];

export default function TypeSelectionStep() {
    const { setValue, watch } = useFormContext();
    const theme = useTheme();
    const selectedType = watch('tipo') as TipoInscricao;

    const handleSelect = (tipo: TipoInscricao) => {
        setValue('tipo', tipo, { shouldValidate: true });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Typography variant="h6" color="primary" fontWeight="bold" textAlign="center">
                Como deseja se inscrever?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Escolha a modalidade de inscrição para o evento selecionado.
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                {typeOptions.map((option) => {
                    const isSelected = selectedType === option.value;
                    return (
                        <Paper
                            key={option.value}
                            elevation={isSelected ? 6 : 1}
                            onClick={() => handleSelect(option.value)}
                            sx={{
                                flex: '1 1 220px',
                                maxWidth: 300,
                                p: 4,
                                cursor: 'pointer',
                                textAlign: 'center',
                                borderRadius: 3,
                                border: isSelected ? '3px solid' : '2px solid',
                                borderColor: isSelected ? 'warning.main' : 'transparent',
                                bgcolor: isSelected ? 'warning.50' : 'background.paper',
                                boxShadow: isSelected ? '0 0 15px rgba(237, 108, 2, 0.3)' : 'none',
                                transition: 'all 0.25s ease',
                                ...(isSelected && {
                                    animation: 'pulseGlowType 2s infinite',
                                    '@keyframes pulseGlowType': {
                                        '0%': { boxShadow: '0 0 0 0 rgba(237, 108, 2, 0.4)' },
                                        '70%': { boxShadow: '0 0 0 12px rgba(237, 108, 2, 0)' },
                                        '100%': { boxShadow: '0 0 0 0 rgba(237, 108, 2, 0)' }
                                    }
                                }),
                                '&:hover': {
                                    borderColor: isSelected ? 'warning.main' : 'warning.light',
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme.shadows[4],
                                },
                            }}
                        >
                            <Typography variant="h2" sx={{ mb: 2, lineHeight: 1 }}>
                                {option.icon}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color={isSelected ? 'warning.dark' : 'text.primary'} gutterBottom>
                                {option.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {option.description}
                            </Typography>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
}
