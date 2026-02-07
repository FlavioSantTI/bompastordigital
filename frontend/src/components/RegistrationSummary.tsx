import { Box, Paper, Typography, Chip, Button, Divider, useTheme } from '@mui/material';
import { Event, AccessTime, LocationOn, Person, WhatsApp, Edit } from '@mui/icons-material';

interface RegistrationSummaryProps {
    inscricao: any; // Tiparia melhor se tivesse os types globais, vou usar any por praticidade agora e garantir compatibilidade
    onEdit: () => void;
}

export default function RegistrationSummary({ inscricao, onEdit }: RegistrationSummaryProps) {
    const theme = useTheme();

    if (!inscricao) return null;

    const evento = inscricao.eventos;
    const esposo = inscricao.esposo;
    const esposa = inscricao.esposa;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmado': return 'success';
            case 'pendente': return 'warning';
            case 'cancelado': return 'error';
            default: return 'default';
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '--/--/----';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            {/* Cabeçalho do Cartão */}
            <Paper
                elevation={3}
                sx={{
                    overflow: 'hidden',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Event fontSize="small" />
                            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                                ENCONTRO DE CASAIS
                            </Typography>
                        </Box>
                        <Typography variant="h5" fontWeight="bold">
                            {evento?.nome || 'Nome do Evento Indisponível'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, opacity: 0.9 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime fontSize="small" />
                                <Typography variant="body2">
                                    {formatDate(evento?.data_inicio)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn fontSize="small" />
                                <Typography variant="body2">
                                    {inscricao.dioceses?.nome_completo || 'Local à definir'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Chip
                        label={(inscricao.status || 'Pendente').toUpperCase()}
                        color={getStatusColor(inscricao.status) as any}
                        sx={{ fontWeight: 'bold', bgcolor: 'white', color: 'primary.main' }}
                    />
                </Box>

                {/* Corpo do Cartão */}
                <Box sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" /> DADOS DO ESPOSO
                            </Typography>
                            <Typography variant="h6" color="primary.dark">
                                {esposo?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                CPF: {esposo?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'success.main' }}>
                                <WhatsApp fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    {esposo?.telefone || 'Não informado'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ flex: 1, borderLeft: { md: `1px solid ${theme.palette.divider}` }, pl: { md: 4 } }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" /> DADOS DA ESPOSA
                            </Typography>
                            <Typography variant="h6" color="secondary.main">
                                {esposa?.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                CPF: {esposa?.cpf}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'success.main' }}>
                                <WhatsApp fontSize="small" />
                                <Typography variant="body2" fontWeight="medium">
                                    {esposa?.telefone || 'Não informado'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {/* Botão Editar desabilitado temporariamente até implementarmos a edição no form */}
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={onEdit}
                            disabled
                            title="Edição em breve"
                        >
                            Editar Inscrição
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Número de Protocolo: #{inscricao.id}
                </Typography>
            </Box>
        </Box>
    );
}
