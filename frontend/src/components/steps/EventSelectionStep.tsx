import { Box, Typography, Card, CardContent, CardActionArea, Chip, Alert, Tooltip } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarMonth, LocationOn, Groups, HowToReg } from '@mui/icons-material';
import { computeEventStatus, getStatusConfig, formatDateOnly, canRegister } from '../../utils/eventStatusUtils';
import type { Evento } from '../../types';

export default function EventSelectionStep() {
    const { control, setValue, formState: { errors } } = useFormContext();
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchEventos() {
            setLoading(true);
            const { data, error } = await supabase
                .from('eventos')
                .select(`
                    id,
                    nome,
                    inscricao_inicio,
                    inscricao_fim,
                    realizacao_inicio,
                    realizacao_fim,
                    data_inicio,
                    data_fim,
                    vagas,
                    publicado,
                    status_manual,
                    municipio_id,
                    is_paid,
                    event_price
                `)
                .eq('publicado', true)
                .order('realizacao_inicio');

            if (!error && data) {
                // Filtrar apenas eventos com inscrições abertas
                const now = new Date();
                const eventosVisiveis = data.filter((evt: any) => {
                    // Mostrar eventos com inscrições abertas ou em breve
                    if (evt.status_manual === 'cancelado') return false;
                    const inscFim = new Date(evt.inscricao_fim);
                    const realFim = new Date(evt.realizacao_fim);
                    // Não mostrar eventos já encerrados
                    return now < realFim;
                });

                // Buscar informações dos municípios
                const eventosComLocal = await Promise.all(
                    eventosVisiveis.map(async (evento: any) => {
                        if (evento.municipio_id) {
                            const { data: municipio } = await supabase
                                .from('municipios')
                                .select('nome_ibge, uf')
                                .eq('codigo_tom', evento.municipio_id)
                                .single();

                            return { ...evento, municipio };
                        }
                        return evento;
                    })
                );
                setEventos(eventosComLocal as Evento[]);
            }
            setLoading(false);
        }
        fetchEventos();
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
                Escolha o Encontro ou Capacitação
            </Typography>

            <Typography variant="body2" color="text.secondary">
                Selecione o evento que deseja participar
            </Typography>

            {loading && (
                <Alert severity="info">Carregando eventos disponíveis...</Alert>
            )}

            {!loading && eventos.length === 0 && (
                <Alert severity="warning">
                    Nenhum evento com inscrições abertas no momento. Entre em contato com a organização.
                </Alert>
            )}

            <Controller
                name="evento_id"
                control={control}
                rules={{ required: 'Selecione um evento para continuar' }}
                render={({ field }) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {eventos.map((evento) => {
                            const status = computeEventStatus(evento);
                            const statusConfig = getStatusConfig(status);
                            const registration = canRegister(evento);
                            const isSelectable = registration.allowed;

                            return (
                                <Card
                                    key={evento.id}
                                    variant="outlined"
                                    sx={{
                                        borderColor: selectedEventId === evento.id ? 'warning.main' : 'grey.300',
                                        borderWidth: selectedEventId === evento.id ? 3 : 1,
                                        bgcolor: selectedEventId === evento.id ? 'warning.50' : 'background.paper',
                                        boxShadow: selectedEventId === evento.id ? '0 0 15px rgba(237, 108, 2, 0.3)' : 'none',
                                        transition: 'all 0.2s',
                                        opacity: isSelectable ? 1 : 0.6,
                                        ...(selectedEventId === evento.id && {
                                            animation: 'pulseGlow 2s infinite',
                                            '@keyframes pulseGlow': {
                                                '0%': { boxShadow: '0 0 0 0 rgba(237, 108, 2, 0.4)' },
                                                '70%': { boxShadow: '0 0 0 12px rgba(237, 108, 2, 0)' },
                                                '100%': { boxShadow: '0 0 0 0 rgba(237, 108, 2, 0)' }
                                            }
                                        }),
                                    }}
                                >
                                    <Tooltip
                                        title={!isSelectable ? registration.reason || '' : ''}
                                        placement="top"
                                    >
                                        <CardActionArea
                                            onClick={() => {
                                                if (!isSelectable) return;
                                                setSelectedEventId(evento.id);
                                                field.onChange(evento.id);
                                                setValue('evento_id', evento.id);
                                            }}
                                            disabled={!isSelectable}
                                            sx={{ p: 2 }}
                                        >
                                            <CardContent sx={{ p: 0 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                                        {evento.nome}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <Chip
                                                            label={`${statusConfig.icon} ${statusConfig.label}`}
                                                            color={statusConfig.color}
                                                            size="small"
                                                            variant={statusConfig.variant || 'filled'}
                                                        />
                                                        {evento.is_paid ? (
                                                            <Chip
                                                                label={`R$ ${evento.event_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                color="warning"
                                                                size="small"
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Gratuito"
                                                                color="success"
                                                                size="small"
                                                            />
                                                        )}
                                                        <Chip
                                                            label={`${evento.vagas} vagas`}
                                                            size="small"
                                                            color="info"
                                                        />
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <HowToReg fontSize="small" color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Inscrições: {formatDateOnly(evento.inscricao_inicio)} até {formatDateOnly(evento.inscricao_fim)}
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarMonth fontSize="small" color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Evento: {formatDateOnly(evento.realizacao_inicio)} até {formatDateOnly(evento.realizacao_fim)}
                                                        </Typography>
                                                    </Box>

                                                    {evento.municipio && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LocationOn fontSize="small" color="action" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {evento.municipio.nome_ibge} - {evento.municipio.uf}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Groups fontSize="small" color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            Encontro de Casais
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </CardActionArea>
                                    </Tooltip>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            />

            {errors.evento_id && (
                <Alert severity="error">
                    {errors.evento_id.message as string}
                </Alert>
            )}
        </Box>
    );
}
