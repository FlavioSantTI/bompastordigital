/**
 * CronogramaPublico — Timeline vertical responsiva para participantes
 * Rota pública: /agenda/:eventoId (sem login necessário)
 * Módulo Cronograma v4.0
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Chip,
    CircularProgress,
    Alert,
    Container,
    alpha,
    useTheme,
    Button,
} from '@mui/material';
import {
    Schedule,
    LocationOn,
    Person,
    CalendarToday,
    QrCode,
    GridView
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import type { Atividade, CategoriaAtividade } from '../types';
import { CATEGORIAS_CONFIG } from '../types';
import {
    fetchAtividadesPublicadas,
    gerarDatasEvento,
    formatDataCurta,
    formatTime,
} from '../services/cronogramaService';

interface EventoInfo {
    id: number;
    nome: string;
    data_inicio: string;
    data_fim: string;
}

export default function CronogramaPublico() {
    const { eventoId } = useParams<{ eventoId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();

    const [evento, setEvento] = useState<EventoInfo | null>(null);
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [datas, setDatas] = useState<string[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtro por categoria
    const [filtroCategoria, setFiltroCategoria] = useState<CategoriaAtividade | 'todas'>('todas');

    const dataSelecionada = datas[tabIndex] || '';

    useEffect(() => {
        if (eventoId) {
            loadAgenda(parseInt(eventoId));
        }
    }, [eventoId]);

    const loadAgenda = async (id: number) => {
        setLoading(true);
        setError('');

        try {
            // Buscar dados do evento
            const { data: evtData, error: evtError } = await supabase
                .from('eventos')
                .select('id, nome, data_inicio, data_fim')
                .eq('id', id)
                .single();

            if (evtError || !evtData) {
                setError('Evento não encontrado.');
                setLoading(false);
                return;
            }

            setEvento(evtData as EventoInfo);

            // Gerar datas
            const d = gerarDatasEvento(evtData.data_inicio, evtData.data_fim);
            setDatas(d);

            // Auto-selecionar o dia de hoje se estiver entre as datas do evento
            const hoje = new Date().toISOString().slice(0, 10);
            const hojeIndex = d.indexOf(hoje);
            if (hojeIndex >= 0) {
                setTabIndex(hojeIndex);
            }

            // Buscar atividades publicadas
            const atividadesData = await fetchAtividadesPublicadas(id);
            setAtividades(atividadesData);
        } catch (err: any) {
            setError('Erro ao carregar agenda: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar atividades do dia selecionado
    const atividadesDoDia = atividades
        .filter(a => a.data === dataSelecionada)
        .filter(a => filtroCategoria === 'todas' || a.categoria === filtroCategoria);

    // Formatar data completa para o header
    const formatDataCompleta = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
        ];
        const diasSemana = [
            'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
            'Quinta-feira', 'Sexta-feira', 'Sábado',
        ];
        return `${diasSemana[date.getDay()]}, ${day} de ${meses[month - 1]} de ${year}`;
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default',
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!evento) return null;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#fcf9f9',
                pb: 4,
            }}
        >
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #FF921C 0%, #ECA427 100%)',
                    color: 'white',
                    py: 4,
                    px: 2,
                    textAlign: 'center',
                    mb: 2,
                }}
            >
                <Box 
                    component="img" 
                    src="/img/logo.jpg" 
                    alt="Logo Bom Pastor" 
                    sx={{ 
                        height: 70, 
                        mb: 2, 
                        borderRadius: '50%', 
                        border: '3px solid rgba(255,255,255,0.2)' 
                    }} 
                />
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{ fontFamily: '"Playfair Display", serif' }}
                >
                    {evento.nome}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5, letterSpacing: 2, fontWeight: 'bold' }}>
                    PROGRAMAÇÃO OFICIAL
                </Typography>
            </Box>

            <Container maxWidth="md">
                {/* Abas por data */}
                {datas.length > 1 && (
                    <Paper sx={{ mb: 2 }}>
                        <Tabs
                            value={tabIndex}
                            onChange={(_, v) => setTabIndex(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            centered={datas.length <= 4}
                            sx={{
                                '& .MuiTab-root': {
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                },
                            }}
                        >
                            {datas.map((data, idx) => (
                                <Tab key={data} label={formatDataCurta(data)} id={`tab-pub-${idx}`} />
                            ))}
                        </Tabs>
                    </Paper>
                )}

                {/* Data selecionada */}
                {dataSelecionada && (
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 2, color: '#FF921C' }}
                    >
                        {formatDataCompleta(dataSelecionada)}
                    </Typography>
                )}

                {/* Filtro por categoria */}
                <Box sx={{ display: 'flex', gap: 0.8, mb: 3, flexWrap: 'wrap' }}>
                    <Chip
                        label="Todas"
                        size="small"
                        variant={filtroCategoria === 'todas' ? 'filled' : 'outlined'}
                        onClick={() => setFiltroCategoria('todas')}
                        color={filtroCategoria === 'todas' ? 'primary' : 'default'}
                    />
                    {(Object.entries(CATEGORIAS_CONFIG) as [CategoriaAtividade, typeof CATEGORIAS_CONFIG[CategoriaAtividade]][]).map(
                        ([key, config]) => (
                            <Chip
                                key={key}
                                label={`${config.icone} ${config.label}`}
                                size="small"
                                variant={filtroCategoria === key ? 'filled' : 'outlined'}
                                onClick={() => setFiltroCategoria(key as CategoriaAtividade)}
                                sx={{
                                    bgcolor: filtroCategoria === key ? config.cor : undefined,
                                    color: filtroCategoria === key ? 'white' : config.cor,
                                    borderColor: config.cor,
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: alpha(config.cor, 0.15),
                                    },
                                }}
                            />
                        )
                    )}
                </Box>

                {/* Timeline de atividades */}
                {atividadesDoDia.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            {filtroCategoria !== 'todas'
                                ? 'Nenhuma atividade nesta categoria para este dia.'
                                : 'Nenhuma atividade publicada para este dia.'}
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ position: 'relative' }}>
                        {/* Linha vertical da timeline */}
                        <Box
                            sx={{
                                position: 'absolute',
                                left: { xs: 16, sm: 24 },
                                top: 0,
                                bottom: 0,
                                width: 3,
                                bgcolor: 'rgba(255, 146, 28, 0.15)',
                                borderRadius: 2,
                            }}
                        />

                        {atividadesDoDia.map((atividade, index) => {
                            const config = CATEGORIAS_CONFIG[atividade.categoria as CategoriaAtividade] || CATEGORIAS_CONFIG.outros;
                            const salaNome = atividade.sala?.nome || 'Sala não definida';

                            return (
                                <Box
                                    key={atividade.id}
                                    sx={{
                                        display: 'flex',
                                        gap: { xs: 1.5, sm: 2 },
                                        mb: 2,
                                        position: 'relative',
                                        animation: `fadeInUp 0.3s ease ${index * 0.05}s both`,
                                        '@keyframes fadeInUp': {
                                            '0%': { opacity: 0, transform: 'translateY(10px)' },
                                            '100%': { opacity: 1, transform: 'translateY(0)' },
                                        },
                                    }}
                                >
                                    {/* Marcador da timeline */}
                                    <Box
                                        sx={{
                                            width: { xs: 36, sm: 52 },
                                            minWidth: { xs: 36, sm: 52 },
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            pt: 1.5,
                                            zIndex: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                bgcolor: config.cor,
                                                border: '3px solid white',
                                                boxShadow: `0 0 0 2px ${alpha(config.cor, 0.3)}`,
                                            }}
                                        />
                                    </Box>

                                    {/* Card da atividade */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            flex: 1,
                                            p: 2,
                                            borderLeft: `4px solid ${config.cor}`,
                                            bgcolor: config.corFundo,
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 16px ${alpha(config.cor, 0.2)}`,
                                                transform: 'translateX(4px)',
                                            },
                                        }}
                                    >
                                        {/* Horário e Categoria */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                                            <Chip
                                                icon={<Schedule sx={{ fontSize: 14 }} />}
                                                label={`${formatTime(atividade.hora_inicio)} – ${formatTime(atividade.hora_fim)}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(config.cor, 0.1),
                                                    color: config.cor,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                            <Chip
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {config.icone.startsWith('/') ? (
                                                            <img src={config.icone} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                                                        ) : (
                                                            <span>{config.icone}</span>
                                                        )}
                                                        <span>{config.label}</span>
                                                    </Box>
                                                }
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor: alpha(config.cor, 0.3),
                                                    color: config.cor,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        </Box>

                                        {/* Título */}
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                            {atividade.titulo}
                                        </Typography>

                                        {/* Descrição */}
                                        {atividade.descricao && (
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary" 
                                                sx={{ 
                                                    mt: 0.5, 
                                                    fontSize: '0.85rem',
                                                    fontStyle: 'italic',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {atividade.descricao}
                                            </Typography>
                                        )}

                                        {/* Info adicional */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, mt: 0.8 }}>
                                            {atividade.palestrante && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {atividade.palestrante}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {salaNome}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                            );
                        })}
                    </Box>
                )}

                {/* Footer */}
                <Box sx={{ mt: 6, pt: 3, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        <strong>© 2026 Bom Pastor Digital</strong> • Agenda atualizada em tempo real
                    </Typography>
                    <Button 
                        startIcon={<GridView sx={{ color: '#FF921C' }} />} 
                        onClick={() => navigate('/central')}
                        sx={{ 
                            color: '#FF921C', 
                            textTransform: 'none', 
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            '&:hover': { bgcolor: 'rgba(255, 146, 28, 0.05)' }
                        }}
                    >
                        Voltar ao Hub
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
