const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vptubgtdtwwtthizpssn.supabase.co';
const supabaseKey = 'process.env.VITE_SUPABASE_ANON_KEY'; // Vou tentar pegar do env ou usar a anon se disponível

async function checkTeams() {
    const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHViZ3RkdHd3dHRoaXpwc3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1Mjg2ODIsImV4cCI6MjA1NDA4ODY4Mn0.qT_tM3S0P3X-1_F1-S_Y-6-S_Y-6-S_Y-6-S_Y-6-S_Y'); // Usando a anon key do projeto

    console.log('--- BUSCANDO PESSOA POR EMAIL: favuca.dias@gmail.com ---');
    const { data: pessoa, error: erroPessoa } = await supabase
        .from('pessoas')
        .select('*')
        .ilike('email', 'favuca.dias@gmail.com');
    
    console.log('Pessoas encontradas:', pessoa);

    console.log('\n--- LISTANDO TODAS AS EQUIPES E SEUS MEMBROS ---');
    const { data: equipes, error: erroEquipes } = await supabase
        .from('equipes')
        .select(`
            nome,
            equipe_membros (
                pessoa:pessoas ( nome, email )
            )
        `);

    if (erroEquipes) {
        console.error('Erro ao buscar equipes:', erroEquipes);
    } else {
        equipes.forEach(eq => {
            console.log(`Equipe: ${eq.nome}`);
            eq.equipe_membros.forEach(m => {
                console.log(`  - Membro: ${m.pessoa.nome} (${m.pessoa.email})`);
            });
        });
    }
}

checkTeams();
