import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    is_paid?: boolean;
    event_price?: number | null;
    pix_key_type?: string | null;
    pix_key?: string | null;
    merchant_name?: string | null;
    merchant_city?: string | null;
}

interface ConfirmationData {
    couple: CoupleData;
    event: EventData;
    inscricaoId: number | string;
}

/**
 * Serviço responsável pela geração de PDFs de confirmação de inscrição
 */
export const pdfService = {
    /**
     * Gera um PDF de confirmação de inscrição
     */
    async generateConfirmationPDF(data: ConfirmationData): Promise<Blob> {
        const doc = new jsPDF();

        // Configurações
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let yPos = 20;

        // Header - Logo e Título
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80); // #2C3E50
        doc.text('COMPROVANTE DE INSCRIÇÃO', pageWidth / 2, yPos, { align: 'center' });

        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Bom Pastor Digital', pageWidth / 2, yPos, { align: 'center' });

        yPos += 15;

        // Linha separadora
        doc.setDrawColor(212, 163, 115); // #D4A373
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        yPos += 15;

        // Dados do Evento
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('📅 Dados do Evento', margin, yPos);

        yPos += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        doc.text(`Evento: ${data.event.nome}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Data: ${data.event.data_inicio} a ${data.event.data_fim}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Local: ${data.event.local}`, margin + 5, yPos);

        yPos += 12;

        // Dados do Casal
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('👫 Dados do Casal', margin, yPos);

        yPos += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        doc.text(`Esposo: ${data.couple.esposo.nome}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Email: ${data.couple.esposo.email}`, margin + 5, yPos);
        yPos += 8;
        doc.text(`Esposa: ${data.couple.esposa.nome}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Email: ${data.couple.esposa.email}`, margin + 5, yPos);

        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Nº da Inscrição: ${data.inscricaoId}`, margin + 5, yPos);

        yPos += 15;

        // Se for pago, gerar e renderizar informações do PIX dinâmico
        if (data.event.is_paid) {
            const { getPaymentStrategy } = await import('./paymentStrategies');
            const txId = `BPD${data.inscricaoId}`;
            const paymentStrategy = getPaymentStrategy('pix');
            const paymentPayload = paymentStrategy.generatePayload({
                pixKey: data.event.pix_key || '',
                pixKeyType: data.event.pix_key_type || '',
                merchantName: data.event.merchant_name || 'PAROQUIA BOM PASTOR',
                merchantCity: data.event.merchant_city || 'PALMAS',
                amount: data.event.event_price || 0,
                txId,
            });

            // Instruções de Pagamento
            doc.setFillColor(255, 243, 224); // Background amarelo suave
            doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 65, 'F');

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('💰 Informações de Pagamento', margin + 5, yPos);

            yPos += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(211, 47, 47); // Vermelho
            doc.text(`Valor: R$ ${paymentPayload.displayData.valor}`, margin + 5, yPos);

            yPos += 10;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`Chave PIX (${paymentPayload.displayData.chaveTipo}): ${paymentPayload.displayData.chave}`, margin + 5, yPos);
            yPos += 6;
            doc.text(`Beneficiário: ${paymentPayload.displayData.beneficiario}`, margin + 5, yPos);

            yPos += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 87, 34); // Laranja
            doc.text('📸 IMPORTANTE: Envie o comprovante via WhatsApp:', margin + 5, yPos);
            yPos += 6;
            doc.setFontSize(14);
            doc.setTextColor(211, 47, 47); // Vermelho
            doc.text('(63) 98405-5758', margin + 5, yPos);

            yPos += 15;

            // Código Pix Copia e Cola
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('PIX Copia e Cola:', margin, yPos);
            yPos += 6;

            doc.setFontSize(8);
            doc.setFont('courier', 'normal');
            doc.setTextColor(80, 80, 80);

            // Quebrar o código em múltiplas linhas
            const pixCode = paymentPayload.copiaECola;
            const maxWidth = pageWidth - 2 * margin - 10;
            const lines = doc.splitTextToSize(pixCode, maxWidth);
            doc.text(lines, margin + 5, yPos);

            yPos += lines.length * 4 + 10;
        } else {
            // Se for gratuito, só uma mensagem de sucesso
            doc.setFillColor(232, 245, 233); // Background verde suave
            doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'F');

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(46, 125, 50); // Verde escuro
            doc.text('🎟️ Inscrição Gratuita Confirmada!', margin + 5, yPos);

            yPos += 10;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text('Esta inscrição foi confirmada automaticamente. Não há valor a ser pago.', margin + 5, yPos);

            yPos += 20;
        }

        // Footer
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        const footerText = data.event.is_paid 
            ? 'Sua inscrição será confirmada após a verificação do pagamento.' 
            : 'Sua inscrição está confirmada com sucesso.';
        doc.text(footerText, pageWidth / 2, yPos, { align: 'center' });

        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text('Que Deus abençoe!', pageWidth / 2, yPos, { align: 'center' });

        // Retornar como Blob
        return doc.output('blob');
    },

    /**
     * Faz download do PDF gerado
     */
    async downloadConfirmationPDF(data: ConfirmationData) {
        const blob = await this.generateConfirmationPDF(data);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inscricao-${data.inscricaoId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Converte Blob para Base64 (para envio via API)
     */
    async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
};
