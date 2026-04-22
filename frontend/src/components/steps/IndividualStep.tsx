import { Box, TextField, Typography, Alert, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useFormContext } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import React from 'react';

const CPFMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="000.000.000-00"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

const DateMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="00/00/0000"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

const PhoneMask = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { onChange, ...other } = props;
    return (
        <IMaskInput
            {...other}
            mask="(00) 00000-0000"
            inputRef={ref}
            onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
            overwrite
        />
    );
});

export default function IndividualStep() {
    const { register, formState: { errors }, setValue } = useFormContext();
    const { user } = useAuth();

    const fillEmail = () => {
        if (user?.email) {
            setValue('participante.email', user.email, { shouldValidate: true });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
                Dados do Participante
            </Typography>

            {user?.email && (
                <Alert severity="info" sx={{ mb: 1 }}>
                    Logado como <strong>{user.user_metadata?.nome || user.user_metadata?.full_name || user.email}</strong>.
                    <Box sx={{ mt: 1 }}>
                        <Button variant="outlined" size="small" onClick={fillEmail}>
                            Usar meu e-mail
                        </Button>
                    </Box>
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    fullWidth
                    label="Nome Completo"
                    {...register('participante.nome')}
                    error={!!(errors.participante as any)?.nome}
                    helperText={(errors.participante as any)?.nome?.message as string}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="CPF"
                        {...register('participante.cpf')}
                        InputProps={{ inputComponent: CPFMask as any }}
                        error={!!(errors.participante as any)?.cpf}
                        helperText={(errors.participante as any)?.cpf?.message as string}
                    />
                    <TextField
                        fullWidth
                        label="Nascimento"
                        {...register('participante.nascimento')}
                        InputProps={{ inputComponent: DateMask as any }}
                        error={!!(errors.participante as any)?.nascimento}
                        helperText={(errors.participante as any)?.nascimento?.message as string}
                    />
                </Box>
                <TextField
                    fullWidth
                    label="E-mail"
                    type="email"
                    {...register('participante.email')}
                    error={!!(errors.participante as any)?.email}
                    helperText={(errors.participante as any)?.email?.message as string}
                />
                <TextField
                    fullWidth
                    label="Telefone (WhatsApp)"
                    {...register('participante.telefone')}
                    InputProps={{ inputComponent: PhoneMask as any }}
                    error={!!(errors.participante as any)?.telefone}
                    helperText={(errors.participante as any)?.telefone?.message as string}
                />
            </Box>
        </Box>
    );
}
