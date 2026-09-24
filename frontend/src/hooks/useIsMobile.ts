import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Hook reutilizável para detectar breakpoints mobile.
 * Centraliza a lógica para todo o projeto.
 */

/** Retorna true para telas < md (960px) — tablets e celulares */
export function useIsMobile() {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('md'));
}

/** Retorna true para telas < sm (600px) — celulares pequenos */
export function useIsSmallMobile() {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
}
