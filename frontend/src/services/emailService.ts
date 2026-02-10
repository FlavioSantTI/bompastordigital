import { supabase } from '../lib/supabase';
import { pdfService } from './pdfService';

interface CoupleData {
    esposo: {
        nome: string;
        email: string;
    };
    esposa: {
        nome: string;
        email: string;
    };
}

interface EventData {
    nome: string;
    data_inicio: string;
    data_fim: string;
    local: string;
}

interface EmailConfirmationData {
    couple: CoupleData;
    event: EventData;
    inscricaoId: number | string;
}

/**
 * Serviço responsável pelo envio de emails de confirmação
 */
export const emailService = {
    /**
     * Envia email de confirmação de inscrição com PDF anexado
     */
    async sendConfirmationEmail(data: EmailConfirmationData): Promise<{ success: boolean; error?: string }> {
        try {
            // Gerar PDF
            const pdfBlob = await pdfService.generateConfirmationPDF(data);
            const pdfBase64 = await pdfService.blobToBase64(pdfBlob);

            // Preparar lista de destinatários
            const recipients = [data.couple.esposo.email, data.couple.esposa.email];

            // Criar HTML do email
            const emailHTML = this.createConfirmationEmailHTML(data);

            // Chamar Edge Function
            const { error } = await supabase.functions.invoke('send-confirmation-email', {
                body: {
                    to: recipients,
                    subject: `Confirmação de Inscrição - ${data.event.nome}`,
                    html: emailHTML,
                    pdfBase64,
                    pdfFilename: `inscricao-${data.inscricaoId}.pdf`
                }
            });

            if (error) {
                console.error('Erro ao enviar email:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Erro ao processar envio de email:', error);
            return { success: false, error: (error as Error).message };
        }
    },

    /**
     * Cria o HTML do email de confirmação
     */
    createConfirmationEmailHTML(data: EmailConfirmationData): string {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Inscrição</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #D4A373;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2C3E50;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            color: #2C3E50;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-left: 4px solid #D4A373;
            padding-left: 10px;
        }
        .info-box {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .payment-box {
            background-color: #FFF3E0;
            padding: 20px;
            border-radius: 5px;
            border: 2px solid #FF9800;
            margin: 20px 0;
        }
        .highlight {
            color: #D32F2F;
            font-weight: bold;
            font-size: 18px;
        }
        .whatsapp {
            background-color: white;
            padding: 10px 15px;
            border-radius: 5px;
            border: 3px solid #FF5722;
            display: inline-block;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Inscrição Confirmada!</h1>
            <p>Bom Pastor Digital</p>
        </div>

        <p>Olá <strong>${data.couple.esposo.nome}</strong> e <strong>${data.couple.esposa.nome}</strong>,</p>
        
        <p>Sua inscrição para o evento foi registrada com sucesso! 🎉</p>

        <div class="section">
            <div class="section-title">📅 Dados do Evento</div>
            <div class="info-box">
                <p><strong>Evento:</strong> ${data.event.nome}</p>
                <p><strong>Data:</strong> ${data.event.data_inicio} a ${data.event.data_fim}</p>
                <p><strong>Local:</strong> ${data.event.local}</p>
            </div>
        </div>

        <div class="payment-box">
            <div class="section-title">💰 Para Confirmar sua Participação</div>
            <p><strong>1.</strong> Realize o pagamento de <span class="highlight">R$ 100,00</span> via PIX:</p>
            <div class="info-box">
                <p><strong>Chave PIX (E-mail):</strong> grayceperini@gmail.com</p>
                <p><strong>Beneficiário:</strong> Grayce Kelly Perini Gomes</p>
            </div>
            
            <p><strong>2.</strong> Envie o comprovante via WhatsApp:</p>
            <div class="whatsapp">
                <span class="highlight">(63) 98405-5758</span>
            </div>
        </div>

        <div class="section">
            <p><strong>📎 Anexo:</strong> Comprovante de inscrição em PDF com todas as informações e QR Code do PIX.</p>
        </div>

        <div class="footer">
            <p><em>Sua inscrição será confirmada após a verificação do pagamento.</em></p>
            <p style="margin-top: 15px;">Que Deus abençoe! 🙏</p>
            <p style="margin-top: 10px; color: #999; font-size: 12px;">
                Este é um email automático. Por favor, não responda.<br>
                Para dúvidas, entre em contato via WhatsApp.
            </p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }
};
