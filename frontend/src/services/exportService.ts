import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { APP_VERSION } from '../types';

// Tipagem básica para os dados
export interface DadosExportacao {
    id: string;
    tipo: 'casal' | 'individual';
    status: string;
    created_at: string;
    esposo: {
        nome: string;
        cpf?: string;
        email?: string;
        telefone?: string;
        nascimento?: string;
    };
    esposa?: {
        nome: string;
        cpf?: string;
        email?: string;
        telefone?: string;
        nascimento?: string;
    };
    endereco: {
        cidade: string;
        completo: string;
    };
    pastoral: {
        diocese: string;
        paroquia: string;
        paroco?: string;
        membro_pasfam?: boolean;
        nova_uniao?: boolean;
    };
    logistica: {
        necessita_hospedagem?: boolean;
        restricoes_alimentares?: string;
    };
    observacoes?: string;
    data_inscricao: string;
}

export interface DadosPresenca {
    participante: string;
    turno: string;
    data_evento: string;
    hora_chegada: string;
    diocese: string;
    cidade_inscricao: string;
}

const sanitizarNomeArquivo = (nome: string) => {
    return nome.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-zA-Z0-9]/g, '_') // substitui qualquer coisa não alfanumérica por _
        .replace(/__+/g, '_'); // remove duplicatas de _
};

export const exportService = {
    // 1. Exportar para Excel
    exportarExcel: (dados: DadosExportacao[], nomeArquivo: string = 'Relatorio_Inscritos', individualizar: boolean = false) => {
        try {
            const linhas: any[] = [];
            
            dados.forEach(item => {
                const baseRow = {
                    'Status': item.status?.toUpperCase(),
                    'Data Inscrição': new Date(item.data_inscricao).toLocaleDateString(),
                    'Cidade': item.endereco.cidade,
                    'Diocese': item.pastoral.diocese,
                    'Paróquia': item.pastoral.paroquia,
                    'Segunda União': item.pastoral.nova_uniao ? 'Sim' : 'Não',
                    'Membro Pasfam': item.pastoral.membro_pasfam ? 'Sim' : 'Não',
                    'Hospedagem': item.logistica.necessita_hospedagem ? 'Sim' : 'Não',
                };

                if (individualizar) {
                    const addPessoa = (pessoa: any, tipoInsc: string, d: any) => {
                        linhas.push({
                            '#': 0, // Será preenchido após ordenar
                            'DIOCESE': d.pastoral.diocese || 'N/A',
                            'NOME DO PARTICIPANTE': pessoa.nome || 'N/A',
                            'TIPO': tipoInsc === 'casal' ? 'CASAL' : 'INDIV.',
                            'ASSINATURA': '__________________________'
                        });
                    };

                    addPessoa(item.esposo, item.tipo, item);
                    if (item.tipo === 'casal' && item.esposa) {
                        addPessoa(item.esposa, item.tipo, item);
                    }
                } else {
                    // Formato padrão (uma linha por inscrição)
                    linhas.push({
                        'Tipo': item.tipo === 'individual' ? 'Individual' : 'Casal',
                        ...baseRow,
                        'Participante/Esposo': item.esposo.nome,
                        'CPF 1': item.esposo.cpf,
                        'Email 1': item.esposo.email || '-',
                        'Telefone 1': item.esposo.telefone || '-',
                        'Esposa': item.esposa?.nome || (item.tipo === 'casal' ? '-' : '---'),
                        'CPF 2': item.esposa?.cpf || (item.tipo === 'casal' ? '-' : '---'),
                        'Email 2': item.esposa?.email || (item.tipo === 'casal' ? '-' : '---'),
                        'Telefone 2': item.esposa?.telefone || (item.tipo === 'casal' ? '-' : '---'),
                        'Endereço': item.endereco.completo,
                        'Pároco': item.pastoral.paroco || '-',
                        'Restrições': item.logistica.restricoes_alimentares || '-',
                        'Observações': item.observacoes || '-'
                    });
                }
            });

            // Se for lista de presença, ordenar e preencher o #
            if (individualizar) {
                linhas.sort((a, b) => {
                    const d = a.DIOCESE.localeCompare(b.DIOCESE);
                    if (d !== 0) return d;
                    return a['NOME DO PARTICIPANTE'].localeCompare(b['NOME DO PARTICIPANTE']);
                });
                linhas.forEach((l, idx) => l['#'] = idx + 1);
            }

            const worksheet = XLSX.utils.json_to_sheet(linhas);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inscritos");
            XLSX.writeFile(workbook, `${sanitizarNomeArquivo(nomeArquivo)}.xlsx`);
            console.log('Download Excel disparado');
        } catch (error) {
            console.error('Erro Excel:', error);
            throw error;
        }
    },

    // 2. Exportar Fichas em PDF
    exportarFichasPDF: (dados: DadosExportacao[], tituloEvento: string) => {
        try {
            console.log('Iniciando PDF Fichas...');
            const doc = new jsPDF();

            dados.forEach((inscricao, index) => {
                if (index > 0) doc.addPage();

                doc.setFillColor(30, 58, 95);
                doc.rect(0, 0, 210, 30, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text('FICHA DE INSCRIÇÃO', 105, 20, { align: 'center' });

                doc.setTextColor(30, 58, 95);
                doc.setFontSize(12);
                doc.text(`Evento: ${tituloEvento}`, 14, 40);
                doc.text(`Tipo: ${inscricao.tipo.toUpperCase()}`, 110, 40);
                doc.text(`Status: ${inscricao.status.toUpperCase()}`, 160, 40);

                doc.setDrawColor(200, 200, 200);
                doc.line(14, 45, 196, 45);

                let y = 55;

                const desenharBloco = (titulo: string, linhas: string[]) => {
                    doc.setFillColor(240, 240, 240);
                    doc.rect(14, y, 182, 8, 'F');
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text(titulo, 16, y + 6);
                    y += 14;
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    linhas.forEach(linha => {
                        doc.text(linha, 16, y);
                        y += 6;
                    });
                    y += 4;
                };

                desenharBloco(inscricao.tipo === 'casal' ? 'DADOS DO ESPOSO' : 'DADOS DO PARTICIPANTE', [
                    `Nome: ${inscricao.esposo.nome || 'N/A'}`,
                    `CPF: ${inscricao.esposo.cpf || '-'}   |   Nascimento: ${inscricao.esposo.nascimento ? inscricao.esposo.nascimento.split('-').reverse().join('/') : '-'}`,
                    `Email: ${inscricao.esposo.email || '-'}`,
                    `Telefone: ${inscricao.esposo.telefone || '-'}`
                ]);

                if (inscricao.tipo === 'casal' && inscricao.esposa) {
                    desenharBloco('DADOS DA ESPOSA', [
                        `Nome: ${inscricao.esposa.nome || 'N/A'}`,
                        `CPF: ${inscricao.esposa.cpf || '-'}   |   Nascimento: ${inscricao.esposa.nascimento ? inscricao.esposa.nascimento.split('-').reverse().join('/') : '-'}`,
                        `Email: ${inscricao.esposa.email || '-'}`,
                        `Telefone: ${inscricao.esposa.telefone || '-'}`
                    ]);
                }

                desenharBloco('ENDEREÇO E LOCALIZAÇÃO', [
                    `Diocese: ${inscricao.pastoral.diocese}`,
                    `Cidade: ${inscricao.endereco.cidade}`,
                    `Endereço Completo: ${inscricao.endereco.completo}`
                ]);

                desenharBloco('DADOS PASTORAIS E LOGÍSTICA', [
                    `Paróquia: ${inscricao.pastoral.paroquia}   |   Pároco: ${inscricao.pastoral.paroco || '-'}`,
                    `Membro Pasfam: ${inscricao.pastoral.membro_pasfam ? 'Sim' : 'Não'}   |   Segunda União: ${inscricao.pastoral.nova_uniao ? 'Sim' : 'Não'}`,
                    `Necessita Hospedagem: ${inscricao.logistica.necessita_hospedagem ? 'Sim' : 'Não'}`,
                    `Restrições Alimentares: ${inscricao.logistica.restricoes_alimentares || 'Nenhuma'}`,
                    `Observações: ${inscricao.observacoes || '-'}`
                ]);

                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`© 2026 Bom Pastor Digital • Versão ${APP_VERSION}`, 105, 290, { align: 'center' });
            });

            const fileName = `Fichas_${sanitizarNomeArquivo(tituloEvento)}.pdf`;
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log('Download PDF Fichas disparado');
        } catch (error) {
            console.error('Erro PDF Fichas:', error);
            throw error;
        }
    },

    exportarListaPresencaPDF: (dados: DadosExportacao[], tituloEvento: string) => {
        try {
            console.log('Iniciando PDF Lista...');
            const doc = new jsPDF();
            
            // Cabeçalho Premium
            doc.setFillColor(30, 58, 95);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`Lista de Presença: ${tituloEvento}`, 14, 16);

            const tableColumn = ["Participante(s)", "Contatos (WhatsApp)", "Tipo", "Status"];
            const tableRows: any[] = [];

            const formatarTelefone = (tel: string | undefined) => {
                if (!tel) return '-';
                const clean = tel.replace(/\D/g, '');
                if (clean.length === 11) {
                    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
                }
                if (clean.length === 10) {
                    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
                }
                return tel;
            };

            dados.forEach(dado => {
                const nomes = dado.tipo === 'casal' 
                    ? `${dado.esposo.nome || 'N/A'}\n& ${dado.esposa?.nome || 'N/A'}`
                    : dado.esposo.nome || 'N/A';
                
                const contatos = dado.tipo === 'casal'
                    ? `${formatarTelefone(dado.esposo.telefone)} / ${formatarTelefone(dado.esposa?.telefone)}`
                    : formatarTelefone(dado.esposo.telefone);
                
                tableRows.push([nomes, contatos, dado.tipo === 'casal' ? 'CASAL' : 'INDIV.', dado.status.toUpperCase()]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [30, 58, 95] },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 60 }
                }
            });

            // Rodapé
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`© 2026 Bom Pastor Digital • Versão ${APP_VERSION} | Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            const fileName = `Lista_Presenca_${sanitizarNomeArquivo(tituloEvento)}.pdf`;
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            console.log('Download PDF Lista disparado');
        } catch (error) {
            console.error('Erro PDF Lista:', error);
            throw error;
        }
    },

    // 4. Exportar Presença para Excel
    exportarPresencaExcel: (dados: DadosPresenca[], nomeArquivo: string = 'Relatorio_Presenca') => {
        try {
            const linhas = dados.map(item => ({
                'Participante': item.participante,
                'Turno': item.turno,
                'Data do Evento': new Date(item.data_evento).toLocaleDateString('pt-BR'),
                'Hora de Chegada': item.hora_chegada ? new Date(item.hora_chegada).toLocaleTimeString('pt-BR') : '-',
                'Diocese': item.diocese,
                'Cidade': item.cidade_inscricao
            }));

            const worksheet = XLSX.utils.json_to_sheet(linhas);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Presença");
            XLSX.writeFile(workbook, `${sanitizarNomeArquivo(nomeArquivo)}.xlsx`);
        } catch (error) {
            console.error('Erro Excel Presença:', error);
            throw error;
        }
    }
};
