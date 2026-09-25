import React from 'react';
import { Box, Typography, LinearProgress, Paper, Chip } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { MidiaQuotaInfo } from '../../../types';
import { formatBytes } from '../../../services/midiaService';

interface QuotaBarProps {
    quota: MidiaQuotaInfo;
    loading?: boolean;
}

export const QuotaBar: React.FC<QuotaBarProps> = ({ quota, loading = false }) => {
    // Determinação dinâmica de cores segundo o PRD
    const getColorConfig = () => {
        if (quota.status === 'critico') {
            return {
                barColor: '#dc2626', // Vermelho vivo
                bgColor: 'rgba(220, 38, 38, 0.1)',
                label: 'Cota Crítica (≥ 90%)',
                colorType: 'error' as const,
                icon: <ErrorOutlineIcon fontSize="small" sx={{ color: '#dc2626' }} />
            };
        }
        if (quota.status === 'alerta') {
            return {
                barColor: '#f59e0b', // Âmbar/Laranja
                bgColor: 'rgba(245, 158, 11, 0.1)',
                label: 'Atenção (≥ 80%)',
                colorType: 'warning' as const,
                icon: <WarningAmberIcon fontSize="small" sx={{ color: '#f59e0b' }} />
            };
        }
        return {
            barColor: '#16a34a', // Verde seguro
            bgColor: 'rgba(22, 163, 74, 0.1)',
            label: 'Normal (< 80%)',
            colorType: 'success' as const,
            icon: <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#16a34a' }} />
        };
    };

    const config = getColorConfig();

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: quota.status === 'critico' ? 'error.light' : 'divider',
                bgcolor: quota.status === 'critico' ? 'rgba(239, 68, 68, 0.03)' : 'background.paper',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary' }}>
                        Armazenamento do Evento
                    </Typography>
                </Box>

                <Chip
                    icon={config.icon}
                    label={config.label}
                    size="small"
                    color={config.colorType}
                    variant="outlined"
                    sx={{ fontWeight: 600, px: 0.5 }}
                />
            </Box>

            {/* Barra de Progresso Customizada */}
            <Box sx={{ position: 'relative', width: '100%', mb: 1 }}>
                <LinearProgress
                    variant={loading ? 'indeterminate' : 'determinate'}
                    value={quota.percentual}
                    sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: config.bgColor,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                            backgroundColor: config.barColor,
                            transition: 'transform 0.4s ease, background-color 0.3s ease',
                        }
                    }}
                />
            </Box>

            {/* Detalhes de Consumo e Espaço Livre */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>{formatBytes(quota.usadoBytes)}</strong> de {formatBytes(quota.limiteBytes)} utilizados ({quota.percentual}%)
                </Typography>

                <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                        color: quota.status === 'critico' ? 'error.main' : 'text.primary',
                        fontSize: '0.85rem'
                    }}
                >
                    Disponível: {formatBytes(quota.disponivelBytes)}
                </Typography>
            </Box>

            {/* Aviso Preventivo quando no Vermelho */}
            {quota.status === 'critico' && (
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 18 }} />
                    <Typography variant="caption" color="error.dark" fontWeight={600}>
                        Atenção: O limite de 150 MB deste evento está quase esgotado. Remova arquivos antigos antes de novos uploads.
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};
