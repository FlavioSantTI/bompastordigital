const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
    console.error('Não foi possível ler as credenciais do .env.local');
    process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('\n--- 1. BUSCANDO TODAS AS PESSOAS ---');
        const { data: pessoas, error: errorPessoas } = await supabase
            .from('pessoas')
            .select('id, nome, email, cpf')
            .limit(10);
            
        if (errorPessoas) {
            console.error('Erro ao buscar pessoas:', errorPessoas);
        } else {
            console.log('Pessoas:', pessoas);
        }

        console.log('\n--- 2. LISTANDO TODAS AS EQUIPES ---');
        const { data: equipes, error: errorEquipes } = await supabase
            .from('equipes')
            .select(`
                id,
                nome,
                evento_id,
                equipe_membros (
                    id,
                    pessoa_id,
                    cargo_id,
                    pessoa:pessoas ( id, nome, email ),
                    cargo:cargos_equipe ( id, nome, nivel )
                )
            `);

        if (errorEquipes) {
            console.error('Erro ao buscar equipes:', errorEquipes);
        } else {
            console.log('Equipes encontradas:', JSON.stringify(equipes, null, 2));
        }

        // Testar query de Minhas Equipes com um ID se houver
        if (pessoas && pessoas.length > 0) {
            const firstPessoaId = pessoas[0].id;
            console.log(`\n--- 3. TESTANDO fetchMinhasEquipes PARA O ID ${firstPessoaId} ---`);
            const { data: minhasEquipes, error: errorMinhas } = await supabase
                .from('equipes')
                .select(`
                    *,
                    equipe_membros!inner (
                        id,
                        pessoa_id,
                        cargo_id,
                        cargo:cargos_equipe ( id, nome, nivel )
                    ),
                    all_membros:equipe_membros (
                        id,
                        pessoa_id,
                        cargo_id,
                        pessoa:pessoas ( id, nome, cpf, email, telefone ),
                        cargo:cargos_equipe ( id, nome, nivel )
                    ),
                    equipe_tarefas (
                        *
                    )
                `)
                .in('equipe_membros.pessoa_id', [firstPessoaId]);

            if (errorMinhas) {
                console.error('Erro na query fetchMinhasEquipes:', errorMinhas);
            } else {
                console.log('Minhas Equipes:', JSON.stringify(minhasEquipes, null, 2));
            }
        }
    } catch (e) {
        console.error('Erro geral:', e);
    }
}

test();
