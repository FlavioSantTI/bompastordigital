import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    to: string[];
    subject: string;
    html: string;
    pdfBase64?: string;
    pdfFilename?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html, pdfBase64, pdfFilename }: EmailRequest = await req.json()

        // Configuração SMTP da Hostinger
        const client = new SmtpClient();

        await client.connectTLS({
            hostname: Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com',
            port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
            username: Deno.env.get('SMTP_USER') || '',
            password: Deno.env.get('SMTP_PASS') || '',
        });

        // Preparar anexo PDF se fornecido
        const attachments = pdfBase64 ? [{
            filename: pdfFilename || 'inscricao.pdf',
            content: pdfBase64,
            encoding: 'base64' as const,
            contentType: 'application/pdf'
        }] : [];

        // Enviar email
        await client.send({
            from: Deno.env.get('SMTP_USER') || 'suporte@flaviosantiago.com.br',
            to: to.join(','),
            subject: subject,
            content: html,
            html: html,
            attachments: attachments
        });

        await client.close();

        return new Response(
            JSON.stringify({ success: true, message: 'Email enviado com sucesso' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})
