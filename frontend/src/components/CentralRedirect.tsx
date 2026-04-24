import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente que redireciona automaticamente para o hub público do evento ativo.
 * Facilita o acesso via link curto /central
 */
export default function CentralRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        async function buscarEventoAtivo() {
            try {
                // 1. Tenta buscar o evento que está explicitamente ATIVO
                let { data, error } = await supabase
                    .from('eventos')
                    .select('id')
                    .eq('ativo', true)
                    .order('data_inicio', { ascending: false })
                    .limit(1)
                    .single();

                // 2. Se não encontrar um ativo, busca o último evento qualquer cadastrado
                if (error || !data) {
                    const { data: lastEvent, error: lastError } = await supabase
                        .from('eventos')
                        .select('id')
                        .order('data_inicio', { ascending: false })
                        .limit(1)
                        .single();
                    
                    data = lastEvent;
                    error = lastError;
                }

                if (error || !data) {
                    console.warn('Nenhum evento encontrado para o link central');
                    navigate('/', { replace: true });
                    return;
                }

                // Redireciona para o hub público do evento encontrado
                navigate(`/p/${data.id}`, { replace: true });
            } catch (err) {
                console.error('Erro ao redirecionar para central:', err);
                navigate('/', { replace: true });
            }
        }

        buscarEventoAtivo();
    }, [navigate]);

    return (
        <Box 
            sx={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 2,
                bgcolor: '#f5f5f5'
            }}
        >
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body1" color="text.secondary" fontWeight="medium">
                Carregando portal do evento...
            </Typography>
        </Box>
    );
}
