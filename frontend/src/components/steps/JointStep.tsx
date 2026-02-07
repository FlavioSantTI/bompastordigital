import { Box, TextField, Typography, FormControlLabel, Checkbox, FormGroup, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { PASTORAIS_DISPONIVEIS } from '../../types';

export default function JointStep() {
    const { register, formState: { errors }, control, watch } = useFormContext();

    // Observar o valor de membro_pasfam para mostrar/ocultar pastoral
    const membroPasfam = watch('dados_conjuntos.membro_pasfam');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
                Dados Pastorais e Complementares
            </Typography>

            {/* Seção: Paróquia */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    fullWidth
                    label="Paróquia / Comunidade"
                    {...register('dados_conjuntos.paroquia')}
                    error={!!(errors.dados_conjuntos as any)?.paroquia}
                    helperText={(errors.dados_conjuntos as any)?.paroquia?.message as string}
                />

                <TextField
                    fullWidth
                    label="Nome do Pároco"
                    {...register('dados_conjuntos.paroco')}
                    error={!!(errors.dados_conjuntos as any)?.paroco}
                    helperText={(errors.dados_conjuntos as any)?.paroco?.message as string}
                    placeholder="Ex: Pe. João da Silva"
                />
            </Box>

            {/* Seção: Informações Pastorais */}
            <Box sx={{
                p: 2,
                bgcolor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.100'
            }}>
                <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                    Informações Pastorais
                </Typography>

                <FormGroup>
                    <Controller
                        name="dados_conjuntos.nova_uniao"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                }
                                label="Segunda União Matrimonial"
                            />
                        )}
                    />

                    <Controller
                        name="dados_conjuntos.membro_pasfam"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                }
                                label="Membro da Pastoral Familiar (Pasfam)"
                            />
                        )}
                    />
                </FormGroup>

                {/* Mostrar seleção de pastorais apenas se for membro Pasfam */}
                {membroPasfam && (
                    <Box sx={{ mt: 2, ml: 4 }}>
                        <Controller
                            name="dados_conjuntos.pastorais"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel id="pastorais-label">Pastorais em que atua</InputLabel>
                                    <Select
                                        labelId="pastorais-label"
                                        multiple
                                        value={field.value || []}
                                        onChange={field.onChange}
                                        input={<OutlinedInput label="Pastorais em que atua" />}
                                        renderValue={(selected: string[]) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {PASTORAIS_DISPONIVEIS.map((pastoral) => (
                                            <MenuItem key={pastoral} value={pastoral}>
                                                {pastoral}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Box>
                )}
            </Box>

            {/* Seção: Logística */}
            <Box sx={{
                p: 2,
                bgcolor: 'secondary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'secondary.100'
            }}>
                <Typography variant="subtitle2" color="secondary.main" fontWeight="bold" gutterBottom>
                    Logística do Evento
                </Typography>

                <FormGroup>
                    <Controller
                        name="dados_conjuntos.necessita_hospedagem"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                }
                                label="Necessito de Hospedagem no Local do Evento"
                            />
                        )}
                    />
                </FormGroup>
            </Box>

            {/* Seção: Restrições e Observações */}
            <TextField
                fullWidth
                multiline
                rows={2}
                label="Restrições Alimentares"
                {...register('dados_conjuntos.restricoes_alimentares')}
                placeholder="Ex: Alérgico a glúten, Diabético, Vegetariano..."
                helperText="Informe se há alguma restrição alimentar importante"
            />

            <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações Gerais"
                {...register('dados_conjuntos.observacoes')}
                placeholder="Outras informações que considere relevantes..."
            />
        </Box>
    );
}
