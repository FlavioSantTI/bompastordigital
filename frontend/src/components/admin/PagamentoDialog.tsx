import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    FormControlLabel,
    Switch,
    Alert,
    Chip,
    Divider
} from '@mui/material';
import { AttachMoney, CheckCircle } from '@mui/icons-material';
import ComprovantesManager from './ComprovantesManager';
import { supabase } from '../../lib/supabase';

interface PagamentoDialogProps {
    open: boolean;
    inscricao: any; // Usando any para simplificar, mas idealmente seria a interface Inscricao
    onClose: () => void;
    onStatusChange: () => void;
}

export default function PagamentoDialog({ open, inscricao, onClose, onStatusChange }: PagamentoDialogProps) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (inscricao) {
            setIsConfirmed(inscricao.status === 'confirmada');
            setSuccessMsg('');
        }
    }, [inscricao]);

    const handleToggleStatus = async (newValue: boolean) => {
        setLoading(true);
        const newStatus = newValue ? 'confirmada' : 'pendente';

        try {
            const { error } = await supabase
                .from('inscricoes')
                .update({ status: newStatus })
                .eq('id', inscricao.id);

            if (error) throw error;

            setIsConfirmed(newValue);
            onStatusChange(); // Avisa o pai para atualizar a tabela
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                Gerenciar Pagamento
            </DialogTitle>

            <DialogContent dividers>
                {/* Info do Casal */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Inscrição #{inscricao?.id}</Typography>
                    <Typography variant="h6">{inscricao?.esposo?.nome} & {inscricao?.esposa?.nome}</Typography>
                    <Typography variant="body2">{inscricao?.evento?.nome}</Typography>
                </Box>

                {successMsg && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
                        {successMsg}
                    </Alert>
                )}

                {/* Status Switch */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Status Atual:</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={isConfirmed ? "CONFIRMADA" : "PENDENTE"}
                            color={isConfirmed ? "success" : "warning"}
                            variant={isConfirmed ? "filled" : "outlined"}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isConfirmed}
                                    onChange={(e) => handleToggleStatus(e.target.checked)}
                                    color="success"
                                    disabled={loading}
                                />
                            }
                            label={isConfirmed ? "Pagamento Confirmado" : "Aguardando Pagamento"}
                        />
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Gerenciador de Comprovantes */}
                <Typography variant="subtitle2" color="primary" gutterBottom>
                    Anexar Comprovantes
                </Typography>
                <Typography variant="caption" color="text.secondary" paragraph>
                    Faça o upload do comprovante abaixo. A inscrição será confirmada automaticamente.
                </Typography>

                {inscricao && (
                    <ComprovantesManager
                        inscricaoId={inscricao.id}
                        onUploadSuccess={() => setSuccessMsg('Comprovante enviado com sucesso!')}
                        onComprovantesChange={(count) => {
                            // REGRA: Se tem arquivo e está pendente -> Confirma
                            if (count > 0 && !isConfirmed) {
                                handleToggleStatus(true);
                                setSuccessMsg('Comprovante detectado. Inscrição confirmada automaticamente! ✅');
                            }
                            // REGRA OPCIONAL: Se não tem arquivo e está confirmada -> Volta pra pendente?
                            // Por segurança, vamos apenas automatizar a confirmação positiva (upload -> ok).
                        }}
                    />
                )}

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Fechar</Button>
            </DialogActions>
        </Dialog>
    );
}
