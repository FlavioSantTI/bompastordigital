import { Box, TextField, Typography, useTheme, Button, Alert } from '@mui/material';
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

export default function CoupleStep() {
    const { register, formState: { errors }, setValue } = useFormContext();
    const { user } = useAuth();
    const theme = useTheme();

    const fillEmail = (field: 'esposo.email' | 'esposa.email') => {
        if (user?.email) {
            setValue(field, user.email, { shouldValidate: true });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {user?.email && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Logado como <strong>{user.email}</strong>. Para agilizar, identifique-se:
                    <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" size="small" onClick={() => fillEmail('esposo.email')}>
                            Sou o Esposo
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => fillEmail('esposa.email')}>
                            Sou a Esposa
                        </Button>
                    </Box>
                </Alert>
            )}
            <Box>
                <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
                    Dados do Marido (Esposo)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Nome Completo"
                        {...register('esposo.nome')}
                        error={!!(errors.esposo as any)?.nome}
                        helperText={(errors.esposo as any)?.nome?.message as string}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="CPF"
                            {...register('esposo.cpf')}
                            InputProps={{ inputComponent: CPFMask as any }}
                            error={!!(errors.esposo as any)?.cpf}
                            helperText={(errors.esposo as any)?.cpf?.message as string}
                        />
                        <TextField
                            fullWidth
                            label="Nascimento"
                            {...register('esposo.nascimento')}
                            InputProps={{ inputComponent: DateMask as any }}
                            error={!!(errors.esposo as any)?.nascimento}
                            helperText={(errors.esposo as any)?.nascimento?.message as string}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        label="E-mail"
                        type="email"
                        {...register('esposo.email')}
                        error={!!(errors.esposo as any)?.email}
                        helperText={(errors.esposo as any)?.email?.message as string}
                    />
                    <TextField
                        fullWidth
                        label="Telefone (WhatsApp)"
                        {...register('esposo.telefone')}
                        InputProps={{ inputComponent: PhoneMask as any }}
                        error={!!(errors.esposo as any)?.telefone}
                        helperText={(errors.esposo as any)?.telefone?.message as string}
                    />
                </Box>
            </Box>

            <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
                    Dados da Mulher (Esposa)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Nome Completo"
                        {...register('esposa.nome')}
                        error={!!(errors.esposa as any)?.nome}
                        helperText={(errors.esposa as any)?.nome?.message as string}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="CPF"
                            {...register('esposa.cpf')}
                            InputProps={{ inputComponent: CPFMask as any }}
                            error={!!(errors.esposa as any)?.cpf}
                            helperText={(errors.esposa as any)?.cpf?.message as string}
                        />
                        <TextField
                            fullWidth
                            label="Nascimento"
                            {...register('esposa.nascimento')}
                            InputProps={{ inputComponent: DateMask as any }}
                            error={!!(errors.esposa as any)?.nascimento}
                            helperText={(errors.esposa as any)?.nascimento?.message as string}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        label="E-mail"
                        type="email"
                        {...register('esposa.email')}
                        error={!!(errors.esposa as any)?.email}
                        helperText={(errors.esposa as any)?.email?.message as string}
                    />
                    <TextField
                        fullWidth
                        label="Telefone (WhatsApp)"
                        {...register('esposa.telefone')}
                        InputProps={{ inputComponent: PhoneMask as any }}
                        error={!!(errors.esposa as any)?.telefone}
                        helperText={(errors.esposa as any)?.telefone?.message as string}
                    />
                </Box>
            </Box>
        </Box>
    );
}
