import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

// Cores extraídas do Logo
const colors = {
    primaryDark: '#1E3A5F',   // Azul Petróleo Profundo
    primaryLight: '#53789e',  // Azul Médio
    secondary: '#6B9AC4',     // Azul Céu Suave
    background: '#F8F6F2',    // Creme/Off-white (Papel)
    textPrimary: '#2D3748',   // Cinza Chumbo
    white: '#FFFFFF',
};

const theme = createTheme({
    palette: {
        primary: {
            main: colors.primaryDark,
            light: colors.primaryLight,
            contrastText: '#ffffff',
        },
        secondary: {
            main: colors.secondary,
            contrastText: '#ffffff',
        },
        background: {
            default: colors.background,
            paper: '#ffffff',
        },
        text: {
            primary: colors.textPrimary,
            secondary: '#718096',
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
        borderRadius: 8, // Bordas levemente arredondadas (moderno)
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 30, // Botões redondinhos "Pill shape"
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                    },
                },
                containedPrimary: {
                    background: `linear-gradient(45deg, ${colors.primaryDark} 30%, ${colors.primaryLight} 90%)`,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', // Sombras suaves (Premium)
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.primaryDark,
                    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
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
