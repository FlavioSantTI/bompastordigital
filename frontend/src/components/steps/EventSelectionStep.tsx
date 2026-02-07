import { Box, Typography, Card, CardContent, CardActionArea, Chip, Alert } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarMonth, LocationOn, Groups } from '@mui/icons-material';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
    data_fim: string;
    vagas: number;
    status: string;
    municipio?: {
        nome_ibge: string;
        uf: string;
    };
}

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
                    data_inicio,
                    data_fim,
                    vagas,
                    status,
                    municipio_id
                `)
                .eq('status', 'aberto')
                .order('data_inicio');

            if (!error && data) {
                // Buscar informações dos municípios
                const eventosComLocal = await Promise.all(
                    data.map(async (evento) => {
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
                setEventos(eventosComLocal);
            }
            setLoading(false);
        }
        fetchEventos();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

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
                    Nenhum evento aberto no momento. Entre em contato com a organização.
                </Alert>
            )}

            <Controller
                name="evento_id"
                control={control}
                rules={{ required: 'Selecione um evento para continuar' }}
                render={({ field }) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {eventos.map((evento) => (
                            <Card
                                key={evento.id}
                                variant="outlined"
                                sx={{
                                    borderColor: selectedEventId === evento.id ? 'primary.main' : 'grey.300',
                                    borderWidth: selectedEventId === evento.id ? 2 : 1,
                                    bgcolor: selectedEventId === evento.id ? 'primary.50' : 'background.paper',
                                }}
                            >
                                <CardActionArea
                                    onClick={() => {
                                        setSelectedEventId(evento.id);
                                        field.onChange(evento.id);
                                        setValue('evento_id', evento.id);
                                    }}
                                    sx={{ p: 2 }}
                                >
                                    <CardContent sx={{ p: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" fontWeight="bold" color="primary">
                                                {evento.nome}
                                            </Typography>
                                            <Chip
                                                label={`${evento.vagas} vagas`}
                                                size="small"
                                                color="success"
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarMonth fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatDate(evento.data_inicio)} até {formatDate(evento.data_fim)}
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
                            </Card>
                        ))}
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
