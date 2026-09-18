/**
 * BadgesPage.tsx
 * Página principal do Módulo Unificado de Crachás.
 *
 * Orquestra:
 * 1. BadgeSourcePicker → seleção de evento + fonte de dados
 * 2. BadgeParticipantTable → seleção com checkboxes + busca
 * 3. BadgePreviewDialog → preview PDF + download/impressão
 * 4. BadgeTemplateDialog → personalização de molduras, presets e estilos
 *
 * Substituição desacoplada do CrachasPage.tsx legado.
 *
 * @see docs/PRD_Modulo_Crachas_Unificado.md
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Alert, Chip,
} from '@mui/material';
import { Print, Badge, Palette } from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import type { CanonicalBadgePayload, BadgeSourceEntity, BadgeLayoutConfig } from '../../../types/badge';
import { DEFAULT_BADGE_LAYOUT } from '../../../types/badge';
import { fetchBadgesBySource } from '../../../services/badgeAdapters';
import BadgeSourcePicker from './BadgeSourcePicker';
import BadgeParticipantTable from './BadgeParticipantTable';
import BadgePreviewDialog from './BadgePreviewDialog';
import BadgeTemplateDialog from './BadgeTemplateDialog';
import { pdf } from '@react-pdf/renderer';
import BadgeRenderer from './templates/BadgeRenderer';
import { generateQRCodeBatch } from './templates/BadgeQRCode';

interface Evento {
    id: number;
    nome: string;
    data_inicio: string;
}

const STORAGE_KEY_LAYOUT = 'bpd_badge_layout_config';

export default function BadgesPage() {
    // ── Estado ───────────────────────────────────────────────
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [eventoSelecionado, setEventoSelecionado] = useState<number | ''>('');
    const [sourceSelecionado, setSourceSelecionado] = useState<BadgeSourceEntity>('INSCRITO');

    const [participantes, setParticipantes] = useState<CanonicalBadgePayload[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [busca, setBusca] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

    // ── Configuração de Layout e Molduras ─────────────────────
    const [layoutConfig, setLayoutConfig] = useState<BadgeLayoutConfig>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_LAYOUT);
            if (saved) return JSON.parse(saved);
        } catch {}
        return DEFAULT_BADGE_LAYOUT;
    });

    const handleSaveLayout = (newLayout: BadgeLayoutConfig) => {
        setLayoutConfig(newLayout);
        try {
            localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(newLayout));
        } catch {}
    };

    // ── Carrega lista de eventos na montagem ──────────────────
    useEffect(() => {
        supabase
            .from('eventos')
            .select('id, nome, data_inicio')
            .order('data_inicio', { ascending: false })
            .then(({ data }) => setEventos((data as Evento[]) ?? []));
    }, []);

    // ── Carrega participantes quando evento ou fonte muda ─────
    useEffect(() => {
        if (!eventoSelecionado) {
            setParticipantes([]);
            setSelecionados(new Set());
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                setError('');
                setBusca('');
                const data = await fetchBadgesBySource(sourceSelecionado, eventoSelecionado);
                setParticipantes(data);
                setSelecionados(new Set());
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar participantes');
                setParticipantes([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [eventoSelecionado, sourceSelecionado]);

    // ── Filtragem (para seleção em lote) ──────────────────────
    const filtrados = participantes.filter((p) => {
        const search = busca.toLowerCase();
        return (
            p.primary_name.toLowerCase().includes(search) ||
            (p.secondary_name?.toLowerCase().includes(search) ?? false) ||
            p.category_label.toLowerCase().includes(search) ||
            (p.role_badge?.toLowerCase().includes(search) ?? false) ||
            p.footer_metadata.some(
                (m) =>
                    m.label.toLowerCase().includes(search) ||
                    m.value.toLowerCase().includes(search)
            )
        );
    });

    // ── Handlers de seleção ───────────────────────────────────
    const toggleSelecionado = useCallback((id: string) => {
        setSelecionados((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const selecionarTodos = useCallback(() => {
        setSelecionados(new Set(filtrados.map((p) => p.id)));
    }, [filtrados]);

    const limparSelecao = useCallback(() => {
        setSelecionados(new Set());
    }, []);

    // Participantes selecionados para o preview
    const payloadsSelecionados = participantes.filter((p) => selecionados.has(p.id));

    // ── Impressão rápida de um único crachá ───────────────────
    const handlePrintSingle = useCallback(async (payload: CanonicalBadgePayload) => {
        const qrCodes = (layoutConfig.has_qr_code && payload.qr_code_content)
            ? await generateQRCodeBatch([{ id: payload.id, content: payload.qr_code_content }], 50)
            : new Map<string, string>();

        const doc = (
            <BadgeRenderer
                payloads={[payload]}
                layout={layoutConfig}
                qrCodes={qrCodes}
            />
        );
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) win.focus();
    }, [layoutConfig]);

    // ── Rótulo da fonte selecionada ───────────────────────────
    const sourceLabel: Record<BadgeSourceEntity, string> = {
        INSCRITO: 'Inscritos',
        EQUIPE: 'Equipes',
        CIRCULO: 'Círculos',
        PALESTRANTE: 'Palestrantes',
    };

    return (
        <Box>
            {/* ── Cabeçalho ──────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="h4"
                        color="primary"
                        sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}
                    >
                        Crachás Unificados
                    </Typography>
                    <Chip
                        label="v2.0"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Palette />}
                        onClick={() => setTemplateDialogOpen(true)}
                    >
                        Molduras & Layout
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Print />}
                        disabled={selecionados.size === 0}
                        onClick={() => setPreviewOpen(true)}
                    >
                        Gerar Crachás ({selecionados.size})
                    </Button>
                </Box>
            </Box>

            {/* ── Seletor de Evento + Fonte ─────────────────── */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <BadgeSourcePicker
                    eventos={eventos}
                    eventoSelecionado={eventoSelecionado}
                    onEventoChange={(id) => {
                        setEventoSelecionado(id);
                        setSelecionados(new Set());
                    }}
                    sourceSelecionado={sourceSelecionado}
                    onSourceChange={(src) => {
                        setSourceSelecionado(src);
                        setSelecionados(new Set());
                    }}
                />
            </Paper>

            {/* ── Erro ──────────────────────────────────────── */}
            {error && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* ── Info de contexto ──────────────────────────── */}
            {eventoSelecionado && !loading && participantes.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Badge sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        <strong>{participantes.length}</strong> {sourceLabel[sourceSelecionado].toLowerCase()} encontrados
                    </Typography>
                </Box>
            )}

            {/* ── Tabela de Participantes ───────────────────── */}
            <BadgeParticipantTable
                participantes={participantes}
                selecionados={selecionados}
                onToggle={toggleSelecionado}
                onSelectAll={selecionarTodos}
                onClearSelection={limparSelecao}
                onPrintSingle={handlePrintSingle}
                loading={loading}
                busca={busca}
                onBuscaChange={setBusca}
                emptyMessage={
                    !eventoSelecionado
                        ? 'Selecione um evento e uma origem para ver os participantes.'
                        : `Nenhum dado de ${sourceLabel[sourceSelecionado].toLowerCase()} encontrado para este evento.`
                }
            />

            {/* ── Modal de Personalização de Molduras e Layout ── */}
            <BadgeTemplateDialog
                open={templateDialogOpen}
                onClose={() => setTemplateDialogOpen(false)}
                currentLayout={layoutConfig}
                onSaveLayout={handleSaveLayout}
            />

            {/* ── Modal de Preview ─────────────────────────── */}
            {previewOpen && (
                <BadgePreviewDialog
                    open={previewOpen}
                    payloads={payloadsSelecionados}
                    layout={layoutConfig}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </Box>
    );
}
