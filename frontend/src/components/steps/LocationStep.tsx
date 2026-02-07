import { Box, TextField, Typography, Autocomplete, CircularProgress, Paper } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Municipio {
    codigo_tom: number;
    nome_ibge: string;
    uf: string;
}

export default function LocationStep() {
    const { control, formState: { errors }, register, setValue } = useFormContext();
    const [options, setOptions] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
    const [selectedDiocese, setSelectedDiocese] = useState<{ nome_completo: string, bispo: string } | null>(null);

    const searchMunicipios = async (searchText: string) => {
        if (searchText.length < 2) {
            return;
        }

        setLoading(true);
        const { data } = await supabase
            .from('municipios')
            .select('codigo_tom, nome_ibge, uf')
            .or(`nome_ibge.ilike.%${searchText}%,uf.ilike.%${searchText}%`)
            .order('nome_ibge')
            .limit(50);

        setOptions(data || []);
        setLoading(false);
    };

    const fetchDiocese = async (municipioId: number) => {
        const { data: municipioData } = await supabase
            .from('municipios')
            .select('diocese_id')
            .eq('codigo_tom', municipioId)
            .single();

        if (municipioData?.diocese_id) {
            const { data: dioceseData } = await supabase
                .from('dioceses')
                .select('nome_completo, bispo')
                .eq('id', municipioData.diocese_id)
                .single();

            if (dioceseData) {
                setSelectedDiocese(dioceseData);
            } else {
                setSelectedDiocese(null);
            }
        } else {
            setSelectedDiocese(null);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
                📍 Localização e Endereço
            </Typography>

            <Controller
                name="contato.municipio_id"
                control={control}
                render={({ field }) => (
                    <Autocomplete
                        options={options}
                        getOptionLabel={(option) => `${option.nome_ibge} - ${option.uf}`}
                        loading={loading}
                        value={selectedMunicipio}
                        onChange={(_, newValue) => {
                            setSelectedMunicipio(newValue);
                            field.onChange(newValue?.codigo_tom || 0);

                            // Salvar também o nome para exibição posterior
                            if (newValue) {
                                setValue('contato.municipio_nome', `${newValue.nome_ibge} - ${newValue.uf}`);
                                fetchDiocese(newValue.codigo_tom);
                            } else {
                                setValue('contato.municipio_nome', '');
                                setSelectedDiocese(null);
                            }
                        }}
                        inputValue={inputValue}
                        onInputChange={(_, newInputValue, reason) => {
                            setInputValue(newInputValue);
                            if (reason === 'input') {
                                searchMunicipios(newInputValue);
                            }
                        }}
                        filterOptions={(x) => x}
                        isOptionEqualToValue={(option, value) => option.codigo_tom === value.codigo_tom}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Cidade / Município *"
                                error={!!(errors.contato as any)?.municipio_id}
                                helperText={(errors.contato as any)?.municipio_id?.message || "Digite pelo menos 2 caracteres para buscar"}
                                placeholder="Digite o nome da cidade..."
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        )}
                    />
                )}
            />

            {selectedDiocese && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50', borderColor: 'success.main' }}>
                    <Typography variant="subtitle2" color="success.dark">
                        ✅ Diocese Identificada Automaticamente:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {selectedDiocese.nome_completo}
                    </Typography>
                    {selectedDiocese.bispo && (
                        <Typography variant="body2" color="text.secondary">
                            Bispo: {selectedDiocese.bispo}
                        </Typography>
                    )}
                </Paper>
            )}

            {/* Campo de Endereço Completo */}
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Endereço Completo *"
                {...register('dados_conjuntos.endereco')}
                error={!!(errors.dados_conjuntos as any)?.endereco}
                helperText={(errors.dados_conjuntos as any)?.endereco?.message}
                placeholder="Rua, número, complemento, bairro, CEP"
            />
        </Box>
    );
}
