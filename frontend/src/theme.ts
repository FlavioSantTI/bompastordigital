import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Paleta Azul Celestial & Orvalho (Sky & Ice Light - v6.2)
const colors = {
    primaryMain: '#0284C7',   // Azul Celeste Radiante
    primaryDark: '#0369A1',   // Azul Oceano Nobre
    primaryLight: '#38BDF8',  // Azul Céu Límpido
    secondary: '#0EA5E9',     // Azul Orvalho Vibrante
    background: '#F0F7FF',    // Fundo Azul Orvalho Suave (Soft Ice Blue)
    textPrimary: '#0F172A',   // Azul Slate Escuro
    textSecondary: '#475569', // Azul Acinzentado
    white: '#FFFFFF',
};

const theme = createTheme({
    palette: {
        primary: {
            main: colors.primaryMain,
            light: colors.primaryLight,
            dark: colors.primaryDark,
            contrastText: '#ffffff',
        },
        secondary: {
            main: colors.secondary,
            light: colors.primaryLight,
            contrastText: '#ffffff',
        },
        background: {
            default: colors.background,
            paper: '#ffffff',
        },
        text: {
            primary: colors.textPrimary,
            secondary: colors.textSecondary,
        },
    },
    typography: {
        fontFamily: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            color: colors.primaryDark,
        },
        h2: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            color: colors.primaryDark,
        },
        h3: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            color: colors.primaryDark,
        },
        h4: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            color: colors.primaryDark,
        },
        h5: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            color: colors.primaryDark,
        },
        h6: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            letterSpacing: '0.5px',
        },
        button: {
            fontFamily: '"Lato", sans-serif',
            fontWeight: 600,
            textTransform: 'none', // Botões sem Caps Lock forçado ficam mais elegantes
        },
    },
    shape: {
        borderRadius: 10, // Bordas levemente arredondadas (moderno)
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 30, // Botões redondinhos "Pill shape"
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 6px 16px rgba(2, 132, 199, 0.25)',
                    },
                },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${colors.primaryMain} 0%, ${colors.primaryLight} 100%)`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMain} 100%)`,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 4px 24px rgba(2, 132, 199, 0.07)', // Sombras celestes suaves
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMain} 100%)`,
                    boxShadow: '0px 4px 16px rgba(2, 132, 199, 0.2)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                }
            }
        }
    },
}, ptBR);

export default theme;
