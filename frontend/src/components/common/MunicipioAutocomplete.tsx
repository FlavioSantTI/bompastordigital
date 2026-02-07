import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Municipio {
    codigo_tom: number;
    nome_ibge: string;
    uf: string;
}

interface MunicipioAutocompleteProps {
    value: number; // codigo_tom
    onChange: (codigo_tom: number) => void;
    required?: boolean;
}

export default function MunicipioAutocomplete({ value, onChange, required = true }: MunicipioAutocompleteProps) {
    const [options, setOptions] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<Municipio | null>(null);

    // Carregar município selecionado inicialmente
    useEffect(() => {
        if (value && !selectedMunicipio) {
            loadMunicipioById(value);
        }
    }, [value]);

    const loadMunicipioById = async (codigo_tom: number) => {
        const { data } = await supabase
            .from('municipios')
            .select('codigo_tom, nome_ibge, uf')
            .eq('codigo_tom', codigo_tom)
            .single();

        if (data) {
            setSelectedMunicipio(data);
            setOptions([data]);
        }
    };

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
        <Autocomplete
            options={options}
            getOptionLabel={(option) => `${option.nome_ibge} - ${option.uf}`}
            loading={loading}
            value={selectedMunicipio}
            onChange={(_, newValue) => {
                setSelectedMunicipio(newValue);
                onChange(newValue?.codigo_tom || 0);
            }}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => {
                setInputValue(newInputValue);
                if (reason === 'input') {
                    searchMunicipios(newInputValue);
                }
            }}
            filterOptions={(x) => x} // Desabilita filtro do lado do cliente
            isOptionEqualToValue={(option, value) => option.codigo_tom === value.codigo_tom}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Município"
                    required={required}
                    placeholder="Digite para buscar..."
                    helperText="Digite pelo menos 2 caracteres para buscar"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
}
