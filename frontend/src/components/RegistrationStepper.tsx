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
import type { TipoInscricao } from '../types';
import EventSelectionStep from './steps/EventSelectionStep';
import TypeSelectionStep from './steps/TypeSelectionStep';
import CoupleStep from './steps/CoupleStep';
import IndividualStep from './steps/IndividualStep';
import LocationStep from './steps/LocationStep';
import JointStep from './steps/JointStep';
import ReviewStep from './steps/ReviewStep';
import ConfirmationStep from './steps/ConfirmationStep';

// Schema base (campos compartilhados)
const baseSchema = {
    evento_id: z.number().min(1, 'Selecione um evento'),
    tipo: z.enum(['casal', 'individual']),
    contato: z.object({
        diocese_id: z.number().min(1, 'Diocese obrigatória'),
        diocese_nome: z.string().optional(),
        municipio_id: z.number().min(1, 'Município obrigatório'),
        municipio_nome: z.string().optional(),
    }),
    dados_conjuntos: z.object({
        paroquia: z.string().min(3, 'Paróquia obrigatória'),
        paroco: z.string().min(3, 'Nome do pároco obrigatório'),
        endereco: z.string().min(10, 'Endereço obrigatório'),
        cidade: z.string().optional(),
        nova_uniao: z.boolean(),
        membro_pasfam: z.boolean(),
        pastorais: z.array(z.string()).optional(),
        necessita_hospedagem: z.boolean(),
        restricoes_alimentares: z.string().optional(),
        observacoes: z.string().optional(),
    }),
};

const pessoaSchema = z.object({
    nome: z.string().min(3, 'Nome obrigatório'),
    cpf: z.string().min(14, 'CPF inválido'),
    nascimento: z.string().min(10, 'Data obrigatória'),
    email: z.string().email('E-mail inválido'),
    telefone: z.string().min(15, 'Telefone inválido'),
});

// Schema para casal
const casalSchema = z.object({
    ...baseSchema,
    esposo: pessoaSchema,
    esposa: pessoaSchema,
    participante: z.object({
        nome: z.string().optional(),
        cpf: z.string().optional(),
        nascimento: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
    }).optional(),
});

// Schema para individual
const individualSchema = z.object({
    ...baseSchema,
    participante: pessoaSchema,
    esposo: z.object({
        nome: z.string().optional(),
        cpf: z.string().optional(),
        nascimento: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
    }).optional(),
    esposa: z.object({
        nome: z.string().optional(),
        cpf: z.string().optional(),
        nascimento: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
    }).optional(),
});

type CasalData = z.infer<typeof casalSchema>;
type IndividualData = z.infer<typeof individualSchema>;
type RegistrationData = CasalData | IndividualData;

const stepsForCasal = ['Evento', 'Modalidade', 'Dados do Casal', 'Localização', 'Dados Pastorais', 'Revisão', 'Confirmação'];
const stepsForIndividual = ['Evento', 'Modalidade', 'Seus Dados', 'Localização', 'Dados Pastorais', 'Revisão', 'Confirmação'];

interface RegistrationStepperProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function RegistrationStepper({ onSuccess, onCancel }: RegistrationStepperProps) {
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState<TipoInscricao>('casal');

    const defaultValues = {
        evento_id: 0,
        tipo: 'casal' as TipoInscricao,
        esposo: { nome: '', cpf: '', nascimento: '', email: '', telefone: '' },
        esposa: { nome: '', cpf: '', nascimento: '', email: '', telefone: '' },
        participante: { nome: '', cpf: '', nascimento: '', email: '', telefone: '' },
        contato: { diocese_id: 0, municipio_id: 0 },
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

    const currentSchema = tipo === 'casal' ? casalSchema : individualSchema;

    const methods = useForm<RegistrationData>({
        resolver: zodResolver(currentSchema),
        mode: 'onChange',
        defaultValues,
    });

    const steps = tipo === 'casal' ? stepsForCasal : stepsForIndividual;

    const handleNext = async () => {
        // Step 1 (tipo selection) — sync tipo state
        if (activeStep === 1) {
            const selectedTipo = methods.getValues('tipo') as TipoInscricao;
            if (!selectedTipo) {
                return; // Não avança sem seleção
            }
            setTipo(selectedTipo);
        }

        const fieldsToValidate = getFieldsByStep(activeStep);
        const isValid = fieldsToValidate.length === 0 || await methods.trigger(fieldsToValidate as any);

        if (isValid) {
            if (activeStep === steps.length - 1) {
                onSubmit(methods.getValues());
            } else {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleBack = () => {
        if (activeStep === 0) {
            if (onCancel) onCancel();
        } else {
            setActiveStep((prev) => prev - 1);
        }
    };

    const getFieldsByStep = (step: number): string[] => {
        switch (step) {
            case 0: return ['evento_id'];
            case 1: return ['tipo'];
            case 2: return tipo === 'casal' ? ['esposo', 'esposa'] : ['participante'];
            case 3: return ['contato'];
            case 4: return ['dados_conjuntos'];
            case 5: return []; // ReviewStep
            case 6: return []; // ConfirmationStep
            default: return [];
        }
    };

    const onSubmit = async (data: RegistrationData) => {
        setLoading(true);
        try {
            if (tipo === 'casal') {
                const { registerCouple } = await import('../services/registrationService');
                const { pdfService } = await import('../services/pdfService');

                const casalData = data as CasalData;
                const result = await registerCouple({
                    ...casalData,
                    dados_conjuntos: {
                        ...casalData.dados_conjuntos,
                        cidade: casalData.contato.municipio_nome
                    },
                    evento_id: casalData.evento_id,
                    user_id: user?.id,
                });

                if (result.success && result.inscricaoId && result.evento) {
                    const confirmationData = {
                        couple: {
                            esposo: { nome: casalData.esposo.nome, email: casalData.esposo.email },
                            esposa: { nome: casalData.esposa.nome, email: casalData.esposa.email }
                        },
                        event: {
                            nome: result.evento.nome,
                            data_inicio: result.evento.data_inicio.split('-').reverse().join('/'),
                            data_fim: result.evento.data_fim.split('-').reverse().join('/'),
                            local: result.evento.local || 'A definir'
                        },
                        inscricaoId: result.inscricaoId
                    };

                    let pdfSuccess = false;
                    try {
                        await pdfService.downloadConfirmationPDF(confirmationData);
                        pdfSuccess = true;
                    } catch (pdfError) {
                        console.error('Erro ao gerar PDF:', pdfError);
                    }

                    let message = `✅ ${result.message}\n\nNúmero da inscrição: ${result.inscricaoId}`;
                    if (pdfSuccess) message += '\n\n📄 O comprovante PDF foi baixado!';
                    else message += '\n\n⚠️ Não foi possível gerar o PDF. Anote o número da inscrição.';
                    message += '\n\n💰 Veja as informações de pagamento em "Minhas Inscrições".';

                    alert(message);
                    if (onSuccess) { onSuccess(); } else { methods.reset(); setActiveStep(0); }
                } else {
                    alert(`❌ ${result.message}`);
                }
            } else {
                // Fluxo Individual
                const { registerIndividual } = await import('../services/registrationService');

                const individualData = data as IndividualData;
                const result = await registerIndividual({
                    participante: individualData.participante!,
                    contato: individualData.contato,
                    dados_conjuntos: {
                        ...individualData.dados_conjuntos,
                        cidade: individualData.contato.municipio_nome
                    },
                    evento_id: individualData.evento_id,
                    user_id: user?.id,
                });

                if (result.success && result.inscricaoId) {
                    let message = `✅ ${result.message}\n\nNúmero da inscrição: ${result.inscricaoId}`;
                    message += '\n\n💰 Veja as informações de pagamento em "Minhas Inscrições".';
                    alert(message);
                    if (onSuccess) { onSuccess(); } else { methods.reset(); setActiveStep(0); }
                } else {
                    alert(`❌ ${result.message}`);
                }
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
            case 1: return <TypeSelectionStep />;
            case 2: return tipo === 'casal' ? <CoupleStep /> : <IndividualStep />;
            case 3: return <LocationStep />;
            case 4: return <JointStep />;
            case 5: return <ReviewStep />;
            case 6: return <ConfirmationStep />;
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
                        disabled={loading || (activeStep === 0 && !onCancel)}
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
