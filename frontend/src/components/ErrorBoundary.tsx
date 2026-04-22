import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Warning } from '@mui/icons-material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                        bgcolor: '#f5f5f5',
                        p: 2,
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 5,
                            maxWidth: 480,
                            textAlign: 'center',
                            borderRadius: 3,
                        }}
                    >
                        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Algo deu errado
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Ocorreu um erro inesperado na interface. Clique abaixo para voltar à tela inicial.
                        </Typography>
                        {this.state.error && (
                            <Typography
                                variant="caption"
                                color="error"
                                sx={{ mb: 3, display: 'block', fontFamily: 'monospace' }}
                            >
                                {this.state.error.message}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            size="large"
                            onClick={this.handleReload}
                            sx={{ px: 4 }}
                        >
                            Voltar ao Início
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}
