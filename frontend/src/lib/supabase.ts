import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

// Verificar se as credenciais são placeholders
const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isPlaceholder) {
    console.warn(
        '⚠️ ATENÇÃO: Credenciais do Supabase não configuradas!\n' +
        'Configure o arquivo .env.local com suas credenciais reais:\n' +
        'VITE_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
        'VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
