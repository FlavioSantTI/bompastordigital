import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import RefreshIcon from '@mui/icons-material/Refresh';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { EventoArquivo, MidiaQuotaInfo } from '../../types';
import { midiaService, MAX_EVENTO_QUOTA_BYTES } from '../../services/midiaService';
import { QuotaBar } from './midias/QuotaBar';
import { MidiaUploadDialog } from './midias/MidiaUploadDialog';
import { MidiaGalleryGrid } from './midias/MidiaGalleryGrid';

interface EventoOpcao {
    id: number;
    nome: string;
}

export default function MidiasPage() {
    const { user } = useAuth();
    const [eventos, setEventos] = useState<EventoOpcao[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<number | ''>('');
    const [arquivos, setArquivos] = useState<EventoArquivo[]>([]);
    const [quota, setQuota] = useState<MidiaQuotaInfo>({
        usadoBytes: 0,
        limiteBytes: MAX_EVENTO_QUOTA_BYTES,
        percentual: 0,
        disponivelBytes: MAX_EVENTO_QUOTA_BYTES,
        status: 'normal'
    });

    const [loadingEventos, setLoadingEventos] = useState(true);
    const [loadingArquivos, setLoadingArquivos] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Carrega eventos cadastrados
    useEffect(() => {
        const carregarEventos = async () => {
            setLoadingEventos(true);
            try {
                const { data, error } = await supabase
                    .from('eventos')
                    .select('id, nome')
                    .order('data_inicio', { ascending: false });

                if (error) throw error;

                setEventos(data || []);
                if (data && data.length > 0) {
                    setSelectedEventoId(data[0].id);
                }
            } catch (err: any) {
                console.error('Erro ao carregar lista de eventos:', err);
                setErrorMsg('Erro ao listar eventos: ' + err.message);
            } finally {
                setLoadingEventos(false);
            }
        };

        carregarEventos();
    }, []);

    // Carrega arquivos e informações da cota do evento selecionado
    const carregarArquivosECota = useCallback(async (eventoId: number) => {
        setLoadingArquivos(true);
        setErrorMsg(null);
        try {
            const [listaArquivos, infoQuota] = await Promise.all([
                midiaService.getArquivosByEvento(eventoId),
                midiaService.getQuotaInfo(eventoId)
            ]);

            setArquivos(listaArquivos);
            setQuota(infoQuota);
        } catch (err: any) {
            console.error('Erro ao carregar arquivos/cota:', err);
            setErrorMsg('Falha ao carregar arquivos: ' + (err.message || 'Erro inesperado.'));
        } finally {
            setLoadingArquivos(false);
        }
    }, []);

    useEffect(() => {
        if (selectedEventoId) {
            carregarArquivosECota(Number(selectedEventoId));
        } else {
            setArquivos([]);
            setQuota({
                usadoBytes: 0,
                limiteBytes: MAX_EVENTO_QUOTA_BYTES,
                percentual: 0,
                disponivelBytes: MAX_EVENTO_QUOTA_BYTES,
                status: 'normal'
            });
        }
    }, [selectedEventoId, carregarArquivosECota]);

    return (
        <Box sx={{ width: '100%', pb: 6 }}>
            {/* Cabeçalho da Página */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    mb: 3
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <PermMediaIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                            Mídias & Arquivos do Evento
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Repositório central de documentos, roteiros, fotos e áudios com controle de cota por evento.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => selectedEventoId && carregarArquivosECota(Number(selectedEventoId))}
                        disabled={!selectedEventoId || loadingArquivos}
                        sx={{ fontWeight: 600 }}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setUploadDialogOpen(true)}
                        disabled={!selectedEventoId || quota.status === 'critico'}
                        sx={{ fontWeight: 700, px: 2.5 }}
                    >
                        Enviar Arquivo
                    </Button>
                </Stack>
            </Box>

            {/* Alerta de Erro se houver */}
            {errorMsg && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {errorMsg}
                </Alert>
            )}

            {/* Barra de Seleção de Evento */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3
                }}
            >
                <FormControl fullWidth size="small">
                    <InputLabel id="evento-select-label">Selecione o Evento</InputLabel>
                    <Select
                        labelId="evento-select-label"
                        value={selectedEventoId}
                        label="Selecione o Evento"
                        onChange={(e) => setSelectedEventoId(Number(e.target.value))}
                        disabled={loadingEventos}
                    >
                        {eventos.map((ev) => (
                            <MenuItem key={ev.id} value={ev.id}>
                                {ev.nome}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Barra de Cota do Evento Selecionado */}
            {selectedEventoId && (
                <Box sx={{ mb: 3 }}>
                    <QuotaBar quota={quota} loading={loadingArquivos} />
                </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Conteúdo: Grid de Mídias ou Loading */}
            {loadingArquivos ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary">
                        Carregando arquivos do evento...
                    </Typography>
                </Box>
            ) : selectedEventoId ? (
                <MidiaGalleryGrid
                    arquivos={arquivos}
                    loading={loadingArquivos}
                    onItemDeleted={() => carregarArquivosECota(Number(selectedEventoId))}
                    onItemUpdated={() => carregarArquivosECota(Number(selectedEventoId))}
                    onOpenUpload={() => setUploadDialogOpen(true)}
                />
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider'
                    }}
                >
                    <Typography variant="body1" color="text.secondary">
                        Selecione um evento acima para visualizar e gerenciar seus arquivos e mídias.
                    </Typography>
                </Paper>
            )}

            {/* Diálogo de Upload de Arquivos */}
            {selectedEventoId && (
                <MidiaUploadDialog
                    open={uploadDialogOpen}
                    onClose={() => setUploadDialogOpen(false)}
                    eventoId={Number(selectedEventoId)}
                    quota={quota}
                    onUploadSuccess={() => carregarArquivosECota(Number(selectedEventoId))}
                    userId={user?.id}
                />
            )}
        </Box>
    );
}
