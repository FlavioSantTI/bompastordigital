import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer';
import { type DadosExportacao } from '../../services/exportService';
import { APP_VERSION } from '../../types';

// Registro de fonte para garantir consistência
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
    ]
});

const PRIMARY = '#1E3A5F';
const TEXT_DARK = '#212121';
const TEXT_LIGHT = '#757575';
const BORDER_COLOR = '#E0E0E0';
const BG_STRIPE = '#F9F9F9';

const s = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: TEXT_DARK,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: `2pt solid ${PRIMARY}`,
        paddingBottom: 10,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PRIMARY,
    },
    subtitle: {
        fontSize: 10,
        color: TEXT_LIGHT,
        marginTop: 2,
    },
    version: {
        fontSize: 8,
        color: PRIMARY,
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
    },

    // Layout de Tabela (Para Lista de Presença)
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: BORDER_COLOR,
        borderBottomWidth: 1,
        minHeight: 30,
        alignItems: 'center',
    },
    tableRowStripe: {
        backgroundColor: BG_STRIPE,
    },
    tableHeader: {
        backgroundColor: PRIMARY,
    },
    tableCol: {
        borderRightColor: BORDER_COLOR,
        borderRightWidth: 1,
        padding: 5,
        justifyContent: 'center',
    },
    tableCellHeader: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 9,
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 8,
    },

    // Layout de Ficha (Para Fichas Individuais)
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        backgroundColor: '#F0F0F0',
        padding: 5,
        marginBottom: 8,
        color: PRIMARY,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        fontWeight: 'bold',
        width: 80,
    },
    value: {
        flex: 1,
    },
    divider: {
        borderBottomColor: BORDER_COLOR,
        borderBottomWidth: 1,
        marginVertical: 10,
    },
});

const formatarTelefone = (tel?: string) => {
    if (!tel) return '-';
    const clean = tel.replace(/\D/g, '');
    if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return tel;
};

// 1. Template da Lista de Presença (Tabela de Check-in)
// Tipo auxiliar para linha individual de presença
interface LinhaPresenca {
    nome: string;
    telefone?: string;
    tipo: string;
    status: string;
}

export const ListaPresencaTemplate = ({ dados, tituloEvento }: { dados: DadosExportacao[], tituloEvento: string }) => {
    // Achatar dados: uma pessoa por linha, ordenado alfabeticamente
    const linhas: LinhaPresenca[] = [];
    dados.forEach(d => {
        linhas.push({
            nome: d.esposo.nome,
            telefone: d.esposo.telefone,
            tipo: d.tipo === 'casal' ? 'CASAL' : 'INDIV.',
            status: d.status.toUpperCase(),
        });
        if (d.tipo === 'casal' && d.esposa) {
            linhas.push({
                nome: d.esposa.nome,
                telefone: d.esposa.telefone,
                tipo: 'CASAL',
                status: d.status.toUpperCase(),
            });
        }
    });
    // Ordenar alfabeticamente pelo nome
    linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return (
        <Document title={`Lista de Presenca - ${tituloEvento}`}>
            <Page size="A4" style={s.page} orientation="landscape" wrap>
                <View style={s.header} fixed>
                            <Image src="/img/logo.jpg" style={s.logo} />
                    <View style={s.headerText}>
                        <Text style={s.title}>Lista de Presença (Check-in)</Text>
                        <Text style={s.subtitle}>{tituloEvento} — {linhas.length} participante(s)</Text>
                    </View>
                </View>

                {/* Cabeçalho da tabela (repete em cada página) */}
                <View style={[s.tableRow, s.tableHeader, { borderTopWidth: 1, borderTopColor: BORDER_COLOR }]} fixed>
                    <View style={[s.tableCol, { width: '5%' }]}><Text style={s.tableCellHeader}>#</Text></View>
                    <View style={[s.tableCol, { width: '35%' }]}><Text style={s.tableCellHeader}>Nome</Text></View>
                    <View style={[s.tableCol, { width: '25%' }]}><Text style={s.tableCellHeader}>Contato</Text></View>
                    <View style={[s.tableCol, { width: '10%' }]}><Text style={s.tableCellHeader}>Tipo</Text></View>
                    <View style={[s.tableCol, { width: '10%' }]}><Text style={s.tableCellHeader}>Status</Text></View>
                    <View style={[s.tableCol, { width: '15%' }]}><Text style={s.tableCellHeader}>Assinatura</Text></View>
                </View>

                {/* Linhas de dados — uma pessoa por linha */}
                {linhas.map((p, i) => (
                    <View key={i} style={[s.tableRow, i % 2 === 0 ? {} : s.tableRowStripe]} wrap={false}>
                        <View style={[s.tableCol, { width: '5%' }]}>
                            <Text style={[s.tableCell, { textAlign: 'center' }]}>{i + 1}</Text>
                        </View>
                        <View style={[s.tableCol, { width: '35%' }]}>
                            <Text style={s.tableCell}>{p.nome}</Text>
                        </View>
                        <View style={[s.tableCol, { width: '25%' }]}>
                            <Text style={s.tableCell}>{formatarTelefone(p.telefone)}</Text>
                        </View>
                        <View style={[s.tableCol, { width: '10%' }]}>
                            <Text style={[s.tableCell, { textAlign: 'center' }]}>{p.tipo}</Text>
                        </View>
                        <View style={[s.tableCol, { width: '10%' }]}>
                            <Text style={[s.tableCell, { textAlign: 'center' }]}>{p.status}</Text>
                        </View>
                        <View style={[s.tableCol, { width: '15%' }]} />
                    </View>
                ))}

                <Text style={s.version} fixed>© 2026 Bom Pastor Digital • Versão {APP_VERSION}</Text>
            </Page>
        </Document>
    );
};

// 2. Novo Template: Lista Geral de Inscritos (Ordenado por Diocese/Paróquia)
export const ListaGeralTemplate = ({ dados, tituloEvento }: { dados: DadosExportacao[], tituloEvento: string }) => (
    <Document title={`Lista Geral - ${tituloEvento}`}>
        <Page size="A4" style={s.page} orientation="landscape" wrap>
            <View style={s.header} fixed>
                <Image src="/img/logo.jpg" style={s.logo} />
                <View style={s.headerText}>
                    <Text style={s.title}>Lista Geral de Inscritos</Text>
                    <Text style={s.subtitle}>{tituloEvento} — Organização por Diocese/Paróquia — {dados.length} registro(s)</Text>
                </View>
            </View>

            {/* Cabeçalho da tabela (repete em cada página) */}
            <View style={[s.tableRow, s.tableHeader, { borderTopWidth: 1, borderTopColor: BORDER_COLOR }]} fixed>
                <View style={[s.tableCol, { width: '4%' }]}><Text style={s.tableCellHeader}>#</Text></View>
                <View style={[s.tableCol, { width: '22%' }]}><Text style={s.tableCellHeader}>Diocese</Text></View>
                <View style={[s.tableCol, { width: '18%' }]}><Text style={s.tableCellHeader}>Paróquia</Text></View>
                <View style={[s.tableCol, { width: '26%' }]}><Text style={s.tableCellHeader}>Participante(s)</Text></View>
                <View style={[s.tableCol, { width: '15%' }]}><Text style={s.tableCellHeader}>Contato</Text></View>
                <View style={[s.tableCol, { width: '8%' }]}><Text style={s.tableCellHeader}>Tipo</Text></View>
                <View style={[s.tableCol, { width: '7%' }]}><Text style={s.tableCellHeader}>Status</Text></View>
            </View>

            {/* Linhas de dados */}
            {dados.map((d, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 0 ? {} : s.tableRowStripe]} wrap={false}>
                    <View style={[s.tableCol, { width: '4%' }]}>
                        <Text style={[s.tableCell, { textAlign: 'center' }]}>{i + 1}</Text>
                    </View>
                    <View style={[s.tableCol, { width: '22%' }]}>
                        <Text style={s.tableCell}>{d.pastoral.diocese}</Text>
                    </View>
                    <View style={[s.tableCol, { width: '18%' }]}>
                        <Text style={s.tableCell}>{d.pastoral.paroquia}</Text>
                    </View>
                    <View style={[s.tableCol, { width: '26%' }]}>
                        <Text style={[s.tableCell, { fontWeight: 'bold' }]}>
                            {d.tipo === 'casal' ? `${d.esposo.nome} & ${d.esposa?.nome}` : d.esposo.nome}
                        </Text>
                    </View>
                    <View style={[s.tableCol, { width: '15%' }]}>
                        <Text style={s.tableCell}>{formatarTelefone(d.esposo.telefone)}</Text>
                    </View>
                    <View style={[s.tableCol, { width: '8%' }]}>
                        <Text style={[s.tableCell, { textAlign: 'center' }]}>{d.tipo === 'casal' ? 'CASAL' : 'INDIV.'}</Text>
                    </View>
                    <View style={[s.tableCol, { width: '7%' }]}>
                        <Text style={[s.tableCell, { textAlign: 'center' }]}>{d.status.toUpperCase()}</Text>
                    </View>
                </View>
            ))}

            <Text style={s.version} fixed>© 2026 Bom Pastor Digital • Versão {APP_VERSION}</Text>
        </Page>
    </Document>
);

// 2. Template das Fichas de Inscrição (1 por página)
export const FichasInscricaoTemplate = ({ dados, tituloEvento }: { dados: DadosExportacao[], tituloEvento: string }) => (
    <Document title={`Fichas de Inscricao - ${tituloEvento}`}>
        {dados.map((d, i) => (
            <Page key={i} size="A4" style={s.page}>
                <View style={s.header}>
                            <Image src="/img/logo.jpg" style={s.logo} />
                    <View style={s.headerText}>
                        <Text style={s.title}>Ficha de Inscrição</Text>
                        <Text style={s.subtitle}>{tituloEvento} | Status: {d.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>{d.tipo === 'casal' ? 'DADOS DO ESPOSO' : 'DADOS DO PARTICIPANTE'}</Text>
                    <View style={s.row}><Text style={s.label}>Nome:</Text><Text style={s.value}>{d.esposo.nome}</Text></View>
                    <View style={s.row}><Text style={s.label}>CPF:</Text><Text style={s.value}>{d.esposo.cpf || '-'}</Text></View>
                    <View style={s.row}><Text style={s.label}>Email:</Text><Text style={s.value}>{d.esposo.email || '-'}</Text></View>
                    <View style={s.row}><Text style={s.label}>Telefone:</Text><Text style={s.value}>{formatarTelefone(d.esposo.telefone)}</Text></View>
                </View>

                {d.tipo === 'casal' && d.esposa && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>DADOS DA ESPOSA</Text>
                        <View style={s.row}><Text style={s.label}>Nome:</Text><Text style={s.value}>{d.esposa.nome}</Text></View>
                        <View style={s.row}><Text style={s.label}>CPF:</Text><Text style={s.value}>{d.esposa.cpf || '-'}</Text></View>
                        <View style={s.row}><Text style={s.label}>Email:</Text><Text style={s.value}>{d.esposa.email || '-'}</Text></View>
                        <View style={s.row}><Text style={s.label}>Telefone:</Text><Text style={s.value}>{formatarTelefone(d.esposa.telefone)}</Text></View>
                    </View>
                )}

                <View style={s.section}>
                    <Text style={s.sectionTitle}>ENDEREÇO E LOCALIZAÇÃO</Text>
                    <View style={s.row}><Text style={s.label}>Diocese:</Text><Text style={s.value}>{d.pastoral.diocese}</Text></View>
                    <View style={s.row}><Text style={s.label}>Cidade:</Text><Text style={s.value}>{d.endereco.cidade}</Text></View>
                    <View style={s.row}><Text style={s.label}>Endereço:</Text><Text style={s.value}>{d.endereco.completo}</Text></View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>DADOS PASTORAIS E LOGÍSTICA</Text>
                    <View style={s.row}><Text style={s.label}>Paróquia:</Text><Text style={s.value}>{d.pastoral.paroquia}</Text></View>
                    <View style={s.row}><Text style={s.label}>Membro Pasfam:</Text><Text style={s.value}>{d.pastoral.membro_pasfam ? 'Sim' : 'Não'}</Text></View>
                    <View style={s.row}><Text style={s.label}>Hospedagem:</Text><Text style={s.value}>{d.logistica.necessita_hospedagem ? 'Sim' : 'Não'}</Text></View>
                    <View style={s.row}><Text style={s.label}>Observações:</Text><Text style={s.value}>{d.observacoes || 'Nenhuma'}</Text></View>
                </View>

                <Text style={s.version} fixed>
                    © 2026 Bom Pastor Digital • Versão {APP_VERSION}
                </Text>
            </Page>
        ))}
    </Document>
);

// 4. NOVO Template: Lista de Presença por Diocese (Quebra de página por Diocese)
export const ListaPresencaDioceseTemplate = ({ dados, tituloEvento }: { dados: DadosExportacao[], tituloEvento: string }) => {
    // 1. Achatar e Agrupar por Diocese
    const agrupado: Record<string, LinhaPresenca[]> = {};
    
    dados.forEach(d => {
        const diocese = d.pastoral.diocese || 'Sem Diocese';
        if (!agrupado[diocese]) agrupado[diocese] = [];
        
        // Adiciona esposo/participante
        agrupado[diocese].push({
            nome: d.esposo.nome,
            telefone: d.esposo.telefone,
            tipo: d.tipo === 'casal' ? 'CASAL' : 'INDIV.',
            status: d.status.toUpperCase(),
        });

        // Adiciona esposa separada
        if (d.tipo === 'casal' && d.esposa) {
            agrupado[diocese].push({
                nome: d.esposa.nome,
                telefone: d.esposa.telefone,
                tipo: 'CASAL',
                status: d.status.toUpperCase(),
            });
        }
    });

    const nomesDioceses = Object.keys(agrupado).sort();

    return (
        <Document title={`Lista por Diocese - ${tituloEvento}`}>
            {nomesDioceses.map((dioceseNome) => {
                const pessoas = agrupado[dioceseNome].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                
                return (
                    <Page key={dioceseNome} size="A4" style={s.page} orientation="landscape" wrap>
                        <View style={s.header} fixed>
                                    <Image src="/img/logo.jpg" style={s.logo} />
                            <View style={s.headerText}>
                                <Text style={s.title}>Lista de Presença</Text>
                                <Text style={s.subtitle}>EVENTO: {tituloEvento} | DIOCESE: {dioceseNome.toUpperCase()}</Text>
                            </View>
                        </View>

                        {/* Cabeçalho da tabela */}
                        <View style={[s.tableRow, s.tableHeader, { borderTopWidth: 1, borderTopColor: BORDER_COLOR }]} fixed>
                            <View style={[s.tableCol, { width: '5%' }]}><Text style={s.tableCellHeader}>#</Text></View>
                            <View style={[s.tableCol, { width: '40%' }]}><Text style={s.tableCellHeader}>Nome do Participante</Text></View>
                            <View style={[s.tableCol, { width: '15%' }]}><Text style={s.tableCellHeader}>Tipo</Text></View>
                            <View style={[s.tableCol, { width: '40%' }]}><Text style={s.tableCellHeader}>Assinatura</Text></View>
                        </View>

                        {/* Linhas */}
                        {pessoas.map((p, i) => (
                            <View key={i} style={[s.tableRow, i % 2 === 0 ? {} : s.tableRowStripe]} wrap={false}>
                                <View style={[s.tableCol, { width: '5%' }]}>
                                    <Text style={[s.tableCell, { textAlign: 'center' }]}>{i + 1}</Text>
                                </View>
                                <View style={[s.tableCol, { width: '40%' }]}>
                                    <Text style={[s.tableCell, { fontWeight: 'bold' }]}>{p.nome}</Text>
                                </View>
                                <View style={[s.tableCol, { width: '15%' }]}>
                                    <Text style={[s.tableCell, { textAlign: 'center' }]}>{p.tipo}</Text>
                                </View>
                                <View style={[s.tableCol, { width: '40%' }]} />
                            </View>
                        ))}

                        <Text style={s.version} fixed>© 2026 Bom Pastor Digital • Versão {APP_VERSION}</Text>
                    </Page>
                );
            })}
        </Document>
    );
};

// 5. NOVO Template: Crachás em Branco
export const CrachasEmBrancoTemplate = () => {
    const s = StyleSheet.create({
        page: { width: 595.28, height: 841.89, backgroundColor: '#FFFFFF' },
        half: { height: 420.94, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
        separator: { position: 'absolute', top: 420.44, left: 0, width: '100%', height: 1, backgroundColor: '#E0E0E0' },
        card: {
            width: 283.46, height: 396.85, backgroundColor: '#FFFFFF', borderRadius: 5,
            border: '1.5pt solid #90CAF9', overflow: 'hidden', padding: 15
        },
        header: { alignItems: 'center', marginBottom: 10 },
        logo: { width: 60, height: 60, objectFit: 'contain', marginBottom: 5 },
        eventTitle: { fontSize: 10, fontWeight: 'bold', color: '#1A237E', textAlign: 'center' },
        nameLine: { borderBottom: '1pt solid #EEEEEE', width: '100%', height: 40, marginTop: 40, marginBottom: 30 },
        infoRow: { flexDirection: 'row', marginBottom: 12, borderBottom: '0.5pt solid #F0F0F0', paddingBottom: 2 },
        label: { fontSize: 10, fontWeight: 'bold', color: '#2C3E50', width: 65 },
    });

    const Badge = () => (
        <View style={s.card}>
            <View style={s.header}>
                <Image src="/img/logo.jpg" style={s.logo} />
                <Text style={s.eventTitle}>1ª Formação Regional Norte 3 - Bom Pastor</Text>
            </View>
            <View style={s.nameLine} />
            <View style={s.infoRow}><Text style={s.label}>PARÓQUIA:</Text></View>
            <View style={s.infoRow}><Text style={s.label}>DIOCESE:</Text></View>
            <View style={s.infoRow}><Text style={s.label}>CIDADE:</Text></View>
        </View>
    );

    return (
        <Document title="Crachás em Branco">
            <Page size="A4" style={s.page}>
                <View style={s.half}><Badge /><View style={s.separator} /></View>
                <View style={s.half}><Badge /></View>
            </Page>
        </Document>
    );
};
