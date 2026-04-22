import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    MenuItem,
    Divider,
    Tooltip,
    IconButton,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Church,
    Event as EventIcon,
    People,
    Group,
    CheckCircle,
    TrendingUp,
    Person,
    Favorite,
    PieChart as PieChartIcon,
    TableChart,
    BarChart as BarChartIcon,
    Refresh,
    PersonAdd,
    CameraAlt,
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface Stats {
    totalDioceses: number;
    totalEventos: number;
    totalInscricoes: number;
    eventosAbertos: number;
    totalPessoas: number;
    confirmadas: number;
    pendentes: number;
    casais: number;
    individuais: number;
}

interface EventoRecente {
    id: number;
    nome: string;
    data_inicio: string;
    status: string | null;
    inscricoes_count: number;
    vagas: number;
}

interface InscricaoPorEvento {
    eventoNome: string;
    total: number;
    confirmadas: number;
    pendentes: number;
}

interface PivotRow {
    dioceseNome: string;
    casais: number;
    individuais: number;
    total: number;
}

// Cores premium para gráficos
const COLORS_STATUS = ['#4caf50', '#ff9800'];
const COLORS_TIPO = ['#e91e63', '#2196f3'];
const CHART_COLORS = [
    '#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a',
    '#764ba2', '#00f2fe', '#38f9d7', '#f093fb', '#fccb90',
];

// Função utilitária: exporta um elemento HTML como PNG via Canvas
const exportElementAsPng = async (element: HTMLElement, filename: string) => {
    try {
        // Usar html2canvas inline via canvas nativo
        const canvas = document.createElement('canvas');
        const rect = element.getBoundingClientRect();
        const scale = 2; // Alta resolução (2x)
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);

        // Serializar o elemento para SVG foreignObject
        const data = new XMLSerializer().serializeToString(element);
        const svgStr = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml">${data}</div>
                </foreignObject>
            </svg>
        `;

        const img = new Image();
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });

        // Baixar PNG
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${filename}_${new Date().toISOString().slice(0,10)}.png`;
        link.href = pngUrl;
        link.click();
    } catch {
        // Fallback: usar html2canvas se o método nativo falhar (CORS em estilos)
        // Captura via window.print não é ideal, então tentamos outra abordagem
        // Serializar SVGs internos diretamente
        const svgs = element.querySelectorAll('svg');
        if (svgs.length === 0) return;

        const svg = svgs[0];
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas2 = document.createElement('canvas');
        const svgRect = svg.getBoundingClientRect();
        canvas2.width = svgRect.width * 2;
        canvas2.height = svgRect.height * 2;
        const ctx2 = canvas2.getContext('2d')!;
        ctx2.scale(2, 2);

        const img2 = new Image();
        const blob2 = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url2 = URL.createObjectURL(blob2);

        img2.onload = () => {
            // Fundo branco
            ctx2.fillStyle = '#fff';
            ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
            ctx2.drawImage(img2, 0, 0);
            URL.revokeObjectURL(url2);

            const pngUrl2 = canvas2.toDataURL('image/png');
            const link2 = document.createElement('a');
            link2.download = `${filename}_${new Date().toISOString().slice(0,10)}.png`;
            link2.href = pngUrl2;
            link2.click();
        };
        img2.src = url2;
    }
};

export default function DashboardPage() {
    const theme = useTheme();

    // Refs para snapshot de gráficos
    const refPieStatus = useRef<HTMLDivElement>(null);
    const refPieTipo = useRef<HTMLDivElement>(null);
    const refBarChart = useRef<HTMLDivElement>(null);
    const refPivotTable = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState<Stats>({
        totalDioceses: 0,
        totalEventos: 0,
        totalInscricoes: 0,
        eventosAbertos: 0,
        totalPessoas: 0,
        confirmadas: 0,
        pendentes: 0,
        casais: 0,
        individuais: 0,
    });
    const [eventosRecentes, setEventosRecentes] = useState<EventoRecente[]>([]);
    const [ultimasInscricoes, setUltimasInscricoes] = useState<any[]>([]);
    const [inscricoesPorEvento, setInscricoesPorEvento] = useState<InscricaoPorEvento[]>([]);
    const [pivotData, setPivotData] = useState<PivotRow[]>([]);
    const [eventosLista, setEventosLista] = useState<{ id: number; nome: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Carregar estatísticas básicas
            const [diocesesRes, eventosRes, inscricoesRes, abertosRes] = await Promise.all([
                supabase.from('dioceses').select('*', { count: 'exact', head: true }),
                supabase.from('eventos').select('*', { count: 'exact', head: true }),
                supabase.from('inscricoes').select('*', { count: 'exact', head: true }),
                supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('status', 'aberto'),
            ]);

            // 2. Carregar TODAS as inscrições para métricas de gráficos
            const { data: allInscricoes } = await supabase
                .from('inscricoes')
                .select('id, status, tipo, esposo_id, esposa_id, evento_id, diocese_id, created_at');

            const inscricoes = allInscricoes || [];

            // Calcular status
            const confirmadas = inscricoes.filter(i => i.status === 'confirmada').length;
            const pendentes = inscricoes.filter(i => i.status !== 'confirmada').length;

            // Calcular tipo
            const casais = inscricoes.filter(i => i.tipo === 'casal').length;
            const individuais = inscricoes.filter(i => i.tipo === 'individual').length;

            // Calcular total de pessoas (casais = 2, individual = 1)
            const totalPessoas = inscricoes.reduce((acc, i) => {
                return acc + (i.tipo === 'casal' ? 2 : 1);
            }, 0);

            setStats({
                totalDioceses: diocesesRes.count || 0,
                totalEventos: eventosRes.count || 0,
                totalInscricoes: inscricoesRes.count || 0,
                eventosAbertos: abertosRes.count || 0,
                totalPessoas,
                confirmadas,
                pendentes,
                casais,
                individuais,
            });

            // 3. Carregar lista de eventos
            const { data: eventos } = await supabase
                .from('eventos')
                .select('id, nome, data_inicio, status, vagas')
                .order('data_inicio', { ascending: false });

            setEventosLista((eventos || []).map(e => ({ id: e.id, nome: e.nome })));

            // 4. Carregar eventos recentes com contagem de inscrições
            if (eventos) {
                const eventosComContagem = await Promise.all(
                    eventos.slice(0, 5).map(async (evento) => {
                        const { count } = await supabase
                            .from('inscricoes')
                            .select('*', { count: 'exact', head: true })
                            .eq('evento_id', evento.id);

                        return {
                            ...evento,
                            inscricoes_count: count || 0,
                        };
                    })
                );

                setEventosRecentes(eventosComContagem);

                // 5. Dados do gráfico de barras - inscrições por evento
                const inscPorEvt: InscricaoPorEvento[] = [];
                for (const evento of eventos) {
                    const evtInscricoes = inscricoes.filter(i => i.evento_id === evento.id);
                    if (evtInscricoes.length > 0) {
                        inscPorEvt.push({
                            eventoNome: evento.nome.length > 25 ? evento.nome.substring(0, 22) + '...' : evento.nome,
                            total: evtInscricoes.length,
                            confirmadas: evtInscricoes.filter(i => i.status === 'confirmada').length,
                            pendentes: evtInscricoes.filter(i => i.status !== 'confirmada').length,
                        });
                    }
                }
                setInscricoesPorEvento(inscPorEvt);
            }

            // 6. Pivot table: Inscritos por Diocese x Tipo
            await loadPivotData(inscricoes);

            // 7. Últimas inscrições
            const { data: inscricoesRecentes } = await supabase
                .from('inscricoes')
                .select('id, created_at, status, tipo, esposo_id, esposa_id, evento_id')
                .order('created_at', { ascending: false })
                .limit(5);

            if (inscricoesRecentes) {
                const inscricoesDetalhes = await Promise.all(
                    (inscricoesRecentes as any[]).map(async (insc) => {
                        const { data: esposo } = insc.esposo_id
                            ? await supabase.from('pessoas').select('nome').eq('id', insc.esposo_id).single()
                            : { data: null };

                        const { data: esposa } = insc.esposa_id
                            ? await supabase.from('pessoas').select('nome').eq('id', insc.esposa_id).single()
                            : { data: null };

                        const { data: evento } = await supabase.from('eventos').select('nome').eq('id', insc.evento_id ? Number(insc.evento_id) : 0).single();

                        return {
                            ...insc,
                            esposo,
                            esposa,
                            evento
                        };
                    })
                );
                setUltimasInscricoes(inscricoesDetalhes);
            }
        } catch (err: any) {
            setError('Erro ao carregar dashboard: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPivotData = async (inscricoes: any[]) => {
        // Buscar dioceses das inscrições (converter IDs para número para garantir consistência)
        const dioceseIds = [...new Set(
            inscricoes
                .map(i => i.diocese_id)
                .filter(Boolean)
                .map((id: any) => Number(id))
        )];

        // Usar chave string no map para evitar incompatibilidade de tipos (string vs number)
        const diocesesMap: Record<string, string> = {};
        if (dioceseIds.length > 0) {
            const { data: dioceses } = await supabase
                .from('dioceses')
                .select('id, nome_completo')
                .in('id', dioceseIds);

            if (dioceses) {
                dioceses.forEach((d: any) => {
                    diocesesMap[String(d.id)] = d.nome_completo || `Diocese ${d.id}`;
                });
            }
        }

        // Agrupar por diocese × tipo de inscrição (casal / individual)
        const pivotMap: Record<string, { casais: number; individuais: number }> = {};

        inscricoes.forEach(insc => {
            const idStr = insc.diocese_id ? String(insc.diocese_id) : '';
            const dioceseNome = idStr
                ? (diocesesMap[idStr] || `Diocese ${insc.diocese_id}`)
                : 'Sem Diocese';

            if (!pivotMap[dioceseNome]) {
                pivotMap[dioceseNome] = { casais: 0, individuais: 0 };
            }

            if (insc.tipo === 'individual') {
                pivotMap[dioceseNome].individuais += 1;
            } else {
                pivotMap[dioceseNome].casais += 1;
            }
        });

        const rows: PivotRow[] = Object.entries(pivotMap)
            .map(([dioceseNome, counts]) => ({
                dioceseNome,
                casais: counts.casais,
                individuais: counts.individuais,
                total: counts.casais + counts.individuais,
            }))
            .sort((a, b) => b.total - a.total);

        setPivotData(rows);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const cleanDate = dateStr.substring(0, 10);
        const [year, month, day] = cleanDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
    };

    const getStatusChip = (status: string) => {
        const statusMap: Record<string, { label: string; color: any }> = {
            aberto: { label: 'Aberto', color: 'success' },
            em_andamento: { label: 'Em Andamento', color: 'info' },
            concluido: { label: 'Concluído', color: 'default' },
            cancelado: { label: 'Cancelado', color: 'error' },
        };

        const statusInfo = statusMap[status as any] || { label: status, color: 'default' };
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
    };

    const calculateOcupacao = (inscricoes: number, vagas: number) => {
        if (vagas === 0) return 0;
        return Math.round((inscricoes / vagas) * 100);
    };

    // Custom label do pie chart
    const renderCustomLabel = ({ name, percent }: any) => {
        return `${name}: ${(percent * 100).toFixed(0)}%`;
    };

    // Totais do pivot
    const pivotTotals = {
        casais: pivotData.reduce((acc, row) => acc + row.casais, 0),
        individuais: pivotData.reduce((acc, row) => acc + row.individuais, 0),
        total: pivotData.reduce((acc, row) => acc + row.total, 0),
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Dados para os gráficos de pizza
    const statusData = [
        { name: 'Confirmadas', value: stats.confirmadas },
        { name: 'Pendentes', value: stats.pendentes },
    ].filter(d => d.value > 0);

    const tipoData = [
        { name: 'Casais', value: stats.casais },
        { name: 'Individuais', value: stats.individuais },
    ].filter(d => d.value > 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Dashboard
                </Typography>
                <Tooltip title="Atualizar dados">
                    <IconButton onClick={loadDashboardData} color="primary">
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
                Visão geral do sistema Bom Pastor Digital
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* ==================== CARDS DE ESTATÍSTICAS ==================== */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                <Box sx={{ flex: '1 1 180px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalDioceses}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Dioceses
                                    </Typography>
                                </Box>
                                <Church sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 180px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalEventos}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Eventos
                                    </Typography>
                                </Box>
                                <EventIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 180px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalInscricoes}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Inscrições
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: '1 1 180px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.eventosAbertos}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Eventos Abertos
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* NOVO CARD: Total de Pessoas */}
                <Box sx={{ flex: '1 1 180px' }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        color: 'white',
                        height: '100%'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalPessoas}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Pessoas Inscritas
                                    </Typography>
                                </Box>
                                <PersonAdd sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* ==================== GRÁFICOS DE PIZZA ==================== */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
                {/* Pizza: Confirmados x Pendentes */}
                <Box sx={{ flex: '1 1 380px', minWidth: 0 }}>
                    <Paper sx={{ p: 3, height: '100%' }} ref={refPieStatus}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PieChartIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                                Status das Inscrições
                            </Typography>
                            <Tooltip title="Exportar como PNG">
                                <IconButton
                                    size="small"
                                    onClick={() => refPieStatus.current && exportElementAsPng(refPieStatus.current, 'status_inscricoes')}
                                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                >
                                    <CameraAlt fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Confirmadas vs Pendentes
                        </Typography>

                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {statusData.map((_entry, index) => (
                                            <Cell key={`cell-status-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number, name: string) => [`${value} inscrição(ões)`, name]}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                <Typography color="text.secondary">Nenhuma inscrição cadastrada</Typography>
                            </Box>
                        )}

                        {/* Resumo numérico */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                    {stats.confirmadas}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Confirmadas</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" fontWeight="bold" color="warning.main">
                                    {stats.pendentes}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Pendentes</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Pizza: Casais x Individuais */}
                <Box sx={{ flex: '1 1 380px', minWidth: 0 }}>
                    <Paper sx={{ p: 3, height: '100%' }} ref={refPieTipo}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PieChartIcon color="secondary" />
                            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                                Tipos de Inscrição
                            </Typography>
                            <Tooltip title="Exportar como PNG">
                                <IconButton
                                    size="small"
                                    onClick={() => refPieTipo.current && exportElementAsPng(refPieTipo.current, 'tipos_inscricao')}
                                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                >
                                    <CameraAlt fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Casais vs Individuais
                        </Typography>

                        {tipoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={tipoData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {tipoData.map((_entry, index) => (
                                            <Cell key={`cell-tipo-${index}`} fill={COLORS_TIPO[index % COLORS_TIPO.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: number, name: string) => [`${value} inscrição(ões)`, name]}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                <Typography color="text.secondary">Nenhuma inscrição cadastrada</Typography>
                            </Box>
                        )}

                        {/* Resumo numérico */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Favorite sx={{ color: '#e91e63', fontSize: 20 }} />
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#e91e63' }}>
                                    {stats.casais}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Casais</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Person sx={{ color: '#2196f3', fontSize: 20 }} />
                                <Typography variant="h5" fontWeight="bold" sx={{ color: '#2196f3' }}>
                                    {stats.individuais}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Individuais</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* ==================== GRÁFICO DE BARRAS: Inscrições por Evento ==================== */}
            {inscricoesPorEvento.length > 0 && (
                <Paper
                    sx={{
                        p: 3,
                        mb: 4,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}>
                            <BarChartIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                            Inscrições por Evento
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 5.5 }}>
                        Distribuição de confirmadas e pendentes por evento
                    </Typography>

                    <ResponsiveContainer width="100%" height={Math.max(350, inscricoesPorEvento.length * 70)}>
                        <BarChart
                            data={inscricoesPorEvento}
                            layout="vertical"
                            margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                            barCategoryGap="25%"
                        >
                            <defs>
                                <linearGradient id="gradConfirmadas" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#43e97b" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#38f9d7" stopOpacity={0.9} />
                                </linearGradient>
                                <linearGradient id="gradPendentes" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#fa709a" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#fee140" stopOpacity={0.9} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.06)} horizontal={false} />
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                allowDecimals={false}
                            />
                            <YAxis
                                dataKey="eventoNome"
                                type="category"
                                width={220}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 13, fill: theme.palette.text.primary, fontWeight: 500 }}
                            />
                            <RechartsTooltip
                                cursor={{ fill: alpha(theme.palette.primary.main, 0.04) }}
                                contentStyle={{
                                    background: alpha(theme.palette.background.paper, 0.95),
                                    backdropFilter: 'blur(10px)',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                    borderRadius: 12,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    padding: '10px 16px',
                                }}
                                formatter={(value: number, name: string) => [
                                    `${value} inscrição(ões)`,
                                    name === 'confirmadas' ? '✅ Confirmadas' : '⏳ Pendentes'
                                ]}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: 16 }}
                                formatter={(value: string) => (
                                    <span style={{ color: theme.palette.text.primary, fontWeight: 500, fontSize: 13 }}>
                                        {value === 'confirmadas' ? '✅ Confirmadas' : '⏳ Pendentes'}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="confirmadas"
                                stackId="a"
                                fill="url(#gradConfirmadas)"
                                radius={[0, 0, 0, 0]}
                                animationDuration={1000}
                            />
                            <Bar
                                dataKey="pendentes"
                                stackId="a"
                                fill="url(#gradPendentes)"
                                radius={[0, 6, 6, 0]}
                                animationDuration={1000}
                                animationBegin={300}
                            />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Summary cards below the chart */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, justifyContent: 'center' }}>
                        {inscricoesPorEvento.map((evt, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 0.8,
                                    borderRadius: 2,
                                    bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.08),
                                    border: `1px solid ${alpha(CHART_COLORS[i % CHART_COLORS.length], 0.15)}`,
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold" color="text.primary">
                                    {evt.total}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                                    {evt.eventoNome}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* ==================== PIVOT: Inscritos por Diocese × Tipo ==================== */}
            <Paper
                sx={{
                    mb: 4,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 3,
                }}
            >
                {/* Header da seção */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                        p: 3,
                        pb: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                        }}>
                            <TableChart sx={{ color: 'white', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Inscritos por Diocese
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Distribuição por tipo de inscrição (Casal / Individual)
                            </Typography>
                        </Box>
                    </Box>

                    {/* Resumo rápido */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.8,
                            px: 1.5, py: 0.5, borderRadius: 2,
                            bgcolor: alpha('#e91e63', 0.08),
                            border: `1px solid ${alpha('#e91e63', 0.15)}`,
                        }}>
                            <Favorite sx={{ fontSize: 16, color: '#e91e63' }} />
                            <Typography variant="body2" fontWeight="bold">{pivotTotals.casais}</Typography>
                            <Typography variant="caption" color="text.secondary">casais</Typography>
                        </Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.8,
                            px: 1.5, py: 0.5, borderRadius: 2,
                            bgcolor: alpha('#2196f3', 0.08),
                            border: `1px solid ${alpha('#2196f3', 0.15)}`,
                        }}>
                            <Person sx={{ fontSize: 16, color: '#2196f3' }} />
                            <Typography variant="body2" fontWeight="bold">{pivotTotals.individuais}</Typography>
                            <Typography variant="caption" color="text.secondary">individuais</Typography>
                        </Box>
                    </Box>
                </Box>

                <TableContainer sx={{ maxHeight: 520 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 3,
                                        minWidth: 250,
                                        py: 1.5,
                                        borderRight: '2px solid rgba(255,255,255,0.2)',
                                    }}
                                >
                                    🏛️ Diocese
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.3,
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
                                        minWidth: 120,
                                        py: 1.5,
                                    }}
                                >
                                    💑 Casais
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.3,
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                                        minWidth: 120,
                                        py: 1.5,
                                    }}
                                >
                                    🧑 Individuais
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)',
                                        minWidth: 100,
                                        py: 1.5,
                                    }}
                                >
                                    ∑ Total
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pivotData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary" fontStyle="italic">
                                            Nenhuma inscrição vinculada a dioceses
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {pivotData.map((row, idx) => {
                                        const maxCasais = Math.max(...pivotData.map(r => r.casais));
                                        const maxIndiv = Math.max(...pivotData.map(r => r.individuais));
                                        const intensityCasais = maxCasais > 0 ? row.casais / maxCasais : 0;
                                        const intensityIndiv = maxIndiv > 0 ? row.individuais / maxIndiv : 0;

                                        return (
                                            <TableRow
                                                key={idx}
                                                sx={{
                                                    bgcolor: idx % 2 === 0
                                                        ? 'transparent'
                                                        : alpha(theme.palette.primary.main, 0.02),
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                                                    },
                                                    transition: 'background-color 0.2s',
                                                }}
                                            >
                                                {/* Diocese */}
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 600,
                                                        position: 'sticky',
                                                        left: 0,
                                                        bgcolor: idx % 2 === 0
                                                            ? theme.palette.background.paper
                                                            : alpha(theme.palette.primary.main, 0.03),
                                                        zIndex: 1,
                                                        borderRight: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                                        py: 1.2,
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Church sx={{ fontSize: 16, color: theme.palette.primary.main, opacity: 0.7 }} />
                                                        <Tooltip title={row.dioceseNome} arrow>
                                                            <Typography
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    maxWidth: 220,
                                                                    fontWeight: 600,
                                                                    color: theme.palette.text.primary,
                                                                }}
                                                            >
                                                                {row.dioceseNome}
                                                            </Typography>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>

                                                {/* Casais */}
                                                <TableCell align="center" sx={{ py: 1.2 }}>
                                                    {row.casais > 0 ? (
                                                        <Box sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: 42,
                                                            height: 30,
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha('#e91e63', 0.08 + intensityCasais * 0.3),
                                                            color: intensityCasais > 0.6 ? '#c2185b' : theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            transition: 'all 0.3s',
                                                            '&:hover': {
                                                                transform: 'scale(1.15)',
                                                                boxShadow: `0 2px 8px ${alpha('#e91e63', 0.25)}`,
                                                            },
                                                        }}>
                                                            {row.casais}
                                                        </Box>
                                                    ) : (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: alpha(theme.palette.text.disabled, 0.4), fontSize: '0.8rem' }}
                                                        >
                                                            –
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Individuais */}
                                                <TableCell align="center" sx={{ py: 1.2 }}>
                                                    {row.individuais > 0 ? (
                                                        <Box sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: 42,
                                                            height: 30,
                                                            borderRadius: 1.5,
                                                            bgcolor: alpha('#2196f3', 0.08 + intensityIndiv * 0.3),
                                                            color: intensityIndiv > 0.6 ? '#1565c0' : theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            transition: 'all 0.3s',
                                                            '&:hover': {
                                                                transform: 'scale(1.15)',
                                                                boxShadow: `0 2px 8px ${alpha('#2196f3', 0.25)}`,
                                                            },
                                                        }}>
                                                            {row.individuais}
                                                        </Box>
                                                    ) : (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: alpha(theme.palette.text.disabled, 0.4), fontSize: '0.8rem' }}
                                                        >
                                                            –
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Total */}
                                                <TableCell align="center" sx={{ py: 1.2 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 42,
                                                        height: 30,
                                                        borderRadius: 1.5,
                                                        background: 'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        boxShadow: '0 2px 6px rgba(245, 87, 108, 0.25)',
                                                    }}>
                                                        {row.total}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* Linha de totais */}
                                    <TableRow
                                        sx={{
                                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
                                            borderTop: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                        }}
                                    >
                                        <TableCell
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                position: 'sticky',
                                                left: 0,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                zIndex: 1,
                                                borderRight: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                                py: 1.5,
                                                color: theme.palette.primary.main,
                                            }}
                                        >
                                            ∑ TOTAL GERAL
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: 46,
                                                height: 32,
                                                borderRadius: 1.5,
                                                background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)',
                                            }}>
                                                {pivotTotals.casais}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: 46,
                                                height: 32,
                                                borderRadius: 1.5,
                                                background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                                            }}>
                                                {pivotTotals.individuais}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.5 }}>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: 48,
                                                height: 34,
                                                borderRadius: 2,
                                                background: 'linear-gradient(135deg, #f5576c 0%, #c62828 100%)',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '1rem',
                                                boxShadow: '0 3px 10px rgba(245, 87, 108, 0.35)',
                                            }}>
                                                {pivotTotals.total}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Divider sx={{ mb: 4 }} />

            {/* ==================== TABELA: Eventos Recentes ==================== */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <TrendingUp color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Eventos Recentes
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nome do Evento</strong></TableCell>
                                <TableCell><strong>Data Início</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Inscrições</strong></TableCell>
                                <TableCell><strong>Ocupação</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventosRecentes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Nenhum evento cadastrado ainda
                                    </TableCell>
                                </TableRow>
                            ) : (
                                eventosRecentes.map((evento) => {
                                    const ocupacao = calculateOcupacao(evento.inscricoes_count, evento.vagas);
                                    return (
                                        <TableRow key={evento.id}>
                                            <TableCell>{evento.nome}</TableCell>
                                            <TableCell>{formatDate(evento.data_inicio)}</TableCell>
                                            <TableCell>{getStatusChip(evento.status || 'aberto')}</TableCell>
                                            <TableCell>
                                                {evento.inscricoes_count} / {evento.vagas}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 100,
                                                            height: 8,
                                                            bgcolor: '#e0e0e0',
                                                            borderRadius: 1,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${Math.min(ocupacao, 100)}%`,
                                                                height: '100%',
                                                                bgcolor: ocupacao >= 90 ? '#f44336' : ocupacao >= 70 ? '#ff9800' : '#4caf50',
                                                                transition: 'width 0.3s',
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {ocupacao}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ==================== TABELA: Últimas Inscrições ==================== */}
            <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group /> Últimas Inscrições
                </Typography>
                <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Participante</strong></TableCell>
                                <TableCell><strong>Evento</strong></TableCell>
                                <TableCell><strong>Data/Hora</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ultimasInscricoes?.map((inscricao: any) => (
                                <TableRow key={inscricao.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={inscricao.tipo === 'individual' ? 'Individual' : 'Casal'}
                                            color={inscricao.tipo === 'individual' ? 'info' : 'default'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {inscricao.tipo === 'individual'
                                                ? (inscricao.esposo?.nome || 'N/A')
                                                : `${inscricao.esposo?.nome || 'N/A'} & ${inscricao.esposa?.nome || 'N/A'}`
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{inscricao.evento?.nome || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(inscricao.created_at)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={inscricao.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                                            color={inscricao.status === 'confirmada' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!ultimasInscricoes || ultimasInscricoes.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Nenhuma inscrição recente</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}
