import { Box, Typography, Divider, Paper, Chip } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import type { RegistrationData } from '../../types';

export default function ReviewStep() {
    const { getValues } = useFormContext<RegistrationData>();
    const data = getValues();

    return (
        <Box>
            <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
                Revisão dos Dados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Confira as informações antes de finalizar sua inscrição.
            </Typography>

            {/* Seção: Dados do Casal */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.dark">
                    👫 Dados do Casal
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Esposo */}
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 45%', minWidth: '250px' }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                            Marido (Esposo)
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">{data.esposo.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">CPF: {data.esposo.cpf}</Typography>
                        <Typography variant="body2" color="text.secondary">Nascimento: {data.esposo.nascimento}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">📧 {data.esposo.email}</Typography>
                        <Typography variant="body2">📱 {data.esposo.telefone}</Typography>
                    </Paper>

                    {/* Esposa */}
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 45%', minWidth: '250px' }}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                            Mulher (Esposa)
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">{data.esposa.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">CPF: {data.esposa.cpf}</Typography>
                        <Typography variant="body2" color="text.secondary">Nascimento: {data.esposa.nascimento}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">📧 {data.esposa.email}</Typography>
                        <Typography variant="body2">📱 {data.esposa.telefone}</Typography>
                    </Paper>
                </Box>
            </Box>

            {/* Seção: Localização e Endereço */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" gutterBottom>
                    📍 Localização e Endereço
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Município</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {(data.contato as any).municipio_nome || 'Não selecionado'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                (Diocese detectada automaticamente)
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="body2" color="text.secondary">Endereço Completo</Typography>
                            <Typography variant="body1">{data.dados_conjuntos.endereco}</Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Seção: Dados Pastorais */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" gutterBottom>
                    ⛪ Dados Pastorais
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Paróquia / Comunidade</Typography>
                            <Typography variant="body1" fontWeight="bold">{data.dados_conjuntos.paroquia}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">Pároco</Typography>
                            <Typography variant="body1">{data.dados_conjuntos.paroco}</Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {data.dados_conjuntos.nova_uniao && (
                                <Chip label="Segunda União" color="info" size="small" />
                            )}
                            {data.dados_conjuntos.membro_pasfam && (
                                <Chip label="Membro Pasfam" color="primary" size="small" />
                            )}
                            {data.dados_conjuntos.necessita_hospedagem && (
                                <Chip label="Necessita Hospedagem" color="secondary" size="small" />
                            )}
                        </Box>

                        {data.dados_conjuntos.membro_pasfam && data.dados_conjuntos.pastorais && data.dados_conjuntos.pastorais.length > 0 && (
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Pastorais em que atua:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {data.dados_conjuntos.pastorais.map((pastoral) => (
                                        <Chip key={pastoral} label={pastoral} variant="outlined" size="small" />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Seção: Observações */}
            {(data.dados_conjuntos.restricoes_alimentares || data.dados_conjuntos.observacoes) && (
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" gutterBottom>
                        📝 Observações
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        {data.dados_conjuntos.restricoes_alimentares && (
                            <Box sx={{ mb: data.dados_conjuntos.observacoes ? 2 : 0 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Restrições Alimentares:
                                </Typography>
                                <Typography variant="body1">{data.dados_conjuntos.restricoes_alimentares}</Typography>
                            </Box>
                        )}

                        {data.dados_conjuntos.observacoes && (
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Observações Gerais:
                                </Typography>
                                <Typography variant="body1">{data.dados_conjuntos.observacoes}</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    ✅ Confira todos os dados acima. No próximo passo você verá as informações de pagamento.
                </Typography>
            </Box>
        </Box>
    );
}
