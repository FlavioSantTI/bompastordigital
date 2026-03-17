import { Box, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Municipio {
    codigo_tom: number;
    nome_ibge: string | null;
    uf: string | null;
}

interface Diocese {
    id: number;
    nome_completo: string;
}

export default function LocationStep() {
    const { control, formState: { errors }, register, setValue } = useFormContext();
    const [options, setOptions] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);
    const [dioceses, setDioceses] = useState<Diocese[]>([]);

    useEffect(() => {
        const loadDioceses = async () => {
            const { data } = await supabase
                .from('dioceses')
                .select('id, nome_completo')
                .order('nome_completo');
            if (data) setDioceses(data);
        };
        loadDioceses();
    }, []);

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
                            } else {
                                setValue('contato.municipio_nome', '');
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

            <Controller
                name="contato.diocese_id"
                control={control}
                render={({ field }) => (
                    <Autocomplete
                        options={dioceses}
                        getOptionLabel={(option) => option.nome_completo}
                        value={dioceses.find(d => d.id === field.value) || null}
                        onChange={(_, newValue) => {
                            field.onChange(newValue?.id || 0);
                            setValue('contato.diocese_nome', newValue?.nome_completo || '');
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Diocese *"
                                error={!!(errors.contato as any)?.diocese_id}
                                helperText={(errors.contato as any)?.diocese_id?.message}
                                placeholder="Selecione a sua diocese"
                            />
                        )}
                    />
                )}
            />

            {/* Campo de Endereço Completo */}
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Endereço (Rua, Número, Bairro, CEP) *"
                {...register('dados_conjuntos.endereco')}
                error={!!(errors.dados_conjuntos as any)?.endereco}
                helperText={(errors.dados_conjuntos as any)?.endereco?.message}
                placeholder="Exemplo: Rua das Acácias, 123, Bairro Bela Vista, 77000-000"
            />
        </Box>
    );
}
