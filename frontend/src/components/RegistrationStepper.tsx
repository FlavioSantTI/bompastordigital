import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Stepper,
    Step,
    StepLabel,
    Button,
    Box,
    CircularProgress
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CoupleStep from './steps/CoupleStep';
import LocationStep from './steps/LocationStep';
import JointStep from './steps/JointStep';
import ReviewStep from './steps/ReviewStep';
import ConfirmationStep from './steps/ConfirmationStep';
import EventSelectionStep from './steps/EventSelectionStep';

const steps = ['Escolha do Evento', 'Dados do Casal', 'Localização', 'Dados Pastorais', 'Revisão', 'Confirmação'];

// Schema de validação
const registrationSchema = z.object({
    evento_id: z.number().min(1, 'Selecione um evento'),
    esposo: z.object({
        nome: z.string().min(3, 'Nome obrigatório'),
        cpf: z.string().min(14, 'CPF inválido'),
        nascimento: z.string().min(10, 'Data obrigatória'),
        email: z.string().email('E-mail inválido'),
        telefone: z.string().min(15, 'Telefone inválido'),
    }),
    esposa: z.object({
        nome: z.string().min(3, 'Nome obrigatório'),
        cpf: z.string().min(14, 'CPF inválido'),
        nascimento: z.string().min(10, 'Data obrigatória'),
        email: z.string().email('E-mail inválido'),
        telefone: z.string().min(15, 'Telefone inválido'),
    }),
    contato: z.object({
        municipio_id: z.number().min(1, 'Município obrigatório'),
        municipio_nome: z.string().optional(),
    }),
    dados_conjuntos: z.object({
        paroquia: z.string().min(3, 'Paróquia obrigatória'),
        paroco: z.string().min(3, 'Nome do pároco obrigatório'),
        endereco: z.string().min(10, 'Endereço obrigatório'),
        nova_uniao: z.boolean(),
        membro_pasfam: z.boolean(),
        pastorais: z.array(z.string()).optional(),
        necessita_hospedagem: z.boolean(),
        restricoes_alimentares: z.string().optional(),
        observacoes: z.string().optional(),
    }),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export default function RegistrationStepper() {
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const defaultValues = {
        evento_id: 0,
        esposo: { nome: '', cpf: '', nascimento: '', email: '', telefone: '' },
        esposa: { nome: '', cpf: '', nascimento: '', email: '', telefone: '' },
        contato: { municipio_id: 0 },
        dados_conjuntos: {
            paroquia: '',
            paroco: '',
            endereco: '',
            nova_uniao: false,
            membro_pasfam: false,
            pastorais: [],
            necessita_hospedagem: false,
            restricoes_alimentares: '',
            observacoes: '',
        },
    };

    const methods = useForm<RegistrationData>({
        resolver: zodResolver(registrationSchema),
        mode: 'onChange',
        defaultValues,
    });

    const handleNext = async () => {
        const fieldsToValidate = getFieldsByStep(activeStep);
        const isValid = await methods.trigger(fieldsToValidate as any);

        if (isValid) {
            if (activeStep === steps.length - 1) {
                onSubmit(methods.getValues());
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const getFieldsByStep = (step: number) => {
        switch (step) {
            case 0: return ['evento_id'];
            case 1: return ['esposo', 'esposa'];
            case 2: return ['contato'];
            case 3: return ['dados_conjuntos'];
            case 4: return []; // ReviewStep - sem validação
            case 5: return []; // ConfirmationStep - sem validação
            default: return [];
        }
    };

    const onSubmit = async (data: RegistrationData) => {
        setLoading(true);
        try {
            // Importar dinamicamente para evitar erro de build
            const { registerCouple } = await import('../services/registrationService');

            const result = await registerCouple({
                ...data,
                evento_id: data.evento_id, // Usando evento selecionado pelo usuário
                user_id: user?.id,
            });

            if (result.success) {
                alert(`✅ ${result.message}\n\nNúmero da inscrição: ${result.inscricaoId}`);
                methods.reset(); // Limpar formulário
                setActiveStep(0); // Voltar ao início
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar inscrição:', error);
            alert('❌ Erro inesperado ao enviar inscrição. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0: return <EventSelectionStep />;
            case 1: return <CoupleStep />;
            case 2: return <LocationStep />;
            case 3: return <JointStep />;
            case 4: return <ReviewStep />;
            case 5: return <ConfirmationStep />;
            default: return null;
        }
    };

    return (
        <FormProvider {...methods}>
            <Box sx={{ width: '100%' }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: 400 }}>
                    {renderStepContent(activeStep)}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0 || loading}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Voltar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> :
                            activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                    </Button>
                </Box>
            </Box>
        </FormProvider>
    );
}
