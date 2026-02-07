import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Tipagem básica para os dados
interface DadosExportacao {
    evento: string;
    esposo: {
        nome: string;
        nascimento: string;
        email?: string;
        telefone?: string;
        cpf: string;
        religiao?: string;
    };
    esposa: {
        nome: string;
        nascimento: string;
        email?: string;
        telefone?: string;
        cpf: string;
        religiao?: string;
    };
    endereco: {
        cidade: string;
        bairro: string;
        rua: string;
        numero: string;
    };
    casamento: {
        data?: string;
        igreja?: string;
        paroquia?: string;
    };
    status: string;
    data_inscricao: string;
}

export const exportService = {
    // 1. Exportar para Excel
    exportarExcel: (dados: DadosExportacao[], nomeArquivo: string = 'Relatorio_Inscritos') => {
        // Formatar dados para planilha plana
        const linhas = dados.map(item => ({
            'Evento': item.evento,
            'Status': item.status?.toUpperCase(),
            'Data Inscrição': new Date(item.data_inscricao).toLocaleDateString(),
            'Esposo - Nome': item.esposo.nome,
            'Esposo - CPF': item.esposo.cpf,
            'Esposo - Telefone': item.esposo.telefone || '-',
            'Esposo - Email': item.esposo.email || '-',
            'Esposo - Nascimento': new Date(item.esposo.nascimento).toLocaleDateString(),
            'Esposa - Nome': item.esposa.nome,
            'Esposa - CPF': item.esposa.cpf,
            'Esposa - Telefone': item.esposa.telefone || '-',
            'Esposa - Email': item.esposa.email || '-',
            'Esposa - Nascimento': new Date(item.esposa.nascimento).toLocaleDateString(),
            'Cidade': item.endereco.cidade,
            'Bairro': item.endereco.bairro,
            'Casamento - Data': item.casamento.data ? new Date(item.casamento.data).toLocaleDateString() : '-',
            'Casamento - Igreja': item.casamento.igreja || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(linhas);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inscritos");

        // Ajustar largura das colunas
        const wscols = [
            { wch: 20 }, { wch: 10 }, { wch: 12 }, // Evento, Status, Data
            { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, // Esposo
            { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, // Esposa
            { wch: 20 }, { wch: 20 } // Endereço
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`);
    },

    // 2. Exportar Fichas em PDF (Layout Bonito)
    exportarFichasPDF: (dados: DadosExportacao[], tituloEvento: string) => {
        const doc = new jsPDF();

        dados.forEach((inscricao, index) => {
            if (index > 0) doc.addPage(); // Nova página para cada casal

            // Cabeçalho
            doc.setFillColor(30, 58, 95); // Azul Bom Pastor
            doc.rect(0, 0, 210, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('FICHA DE INSCRIÇÃO', 105, 20, { align: 'center' });

            // Subtítulo Evento
            doc.setTextColor(30, 58, 95);
            doc.setFontSize(12);
            doc.text(`Evento: ${tituloEvento}`, 14, 40);
            doc.text(`Status: ${inscricao.status.toUpperCase()}`, 150, 40);

            // Linha Divisória
            doc.setDrawColor(200, 200, 200);
            doc.line(14, 45, 196, 45);

            let y = 55;

            // Função auxiliar para desenhar bloco de dados
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
                y += 4; // Espaço extra
            };

            // Bloco Esposo
            desenharBloco('DADOS DO ESPOSO', [
                `Nome: ${inscricao.esposo.nome}`,
                `CPF: ${inscricao.esposo.cpf}   |   Nascimento: ${new Date(inscricao.esposo.nascimento).toLocaleDateString()}`,
                `Email: ${inscricao.esposo.email || '-'}`,
                `Telefone: ${inscricao.esposo.telefone || '-'}`
            ]);

            // Bloco Esposa
            desenharBloco('DADOS DA ESPOSA', [
                `Nome: ${inscricao.esposa.nome}`,
                `CPF: ${inscricao.esposa.cpf}   |   Nascimento: ${new Date(inscricao.esposa.nascimento).toLocaleDateString()}`,
                `Email: ${inscricao.esposa.email || '-'}`,
                `Telefone: ${inscricao.esposa.telefone || '-'}`
            ]);

            // Bloco Endereço
            desenharBloco('ENDEREÇO RESIDENCIAL', [
                `Rua: ${inscricao.endereco.rua}, Nº ${inscricao.endereco.numero}`,
                `Bairro: ${inscricao.endereco.bairro}   |   Cidade: ${inscricao.endereco.cidade}`
            ]);

            // Bloco Casamento
            desenharBloco('DADOS DO MATRIMÔNIO', [
                `Data Casamento: ${inscricao.casamento.data ? new Date(inscricao.casamento.data).toLocaleDateString() : '-'}`,
                `Igreja: ${inscricao.casamento.igreja || '-'}   |   Paróquia: ${inscricao.casamento.paroquia || '-'}`
            ]);

            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Bom Pastor Digital - Sistema de Gestão Pastoral', 105, 290, { align: 'center' });
        });

        doc.save(`Fichas_${tituloEvento.replace(/\s+/g, '_')}.pdf`);
    },

    // 3. Exportar Lista Simples em PDF (Tabela)
    exportarListaPresencaPDF: (dados: DadosExportacao[], tituloEvento: string) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Lista de Presença: ${tituloEvento}`, 14, 20);

        const tableColumn = ["Casal", "Telefones", "Status"];
        const tableRows: any[] = [];

        dados.forEach(dado => {
            const casal = `${dado.esposo.nome.split(' ')[0]} & ${dado.esposa.nome.split(' ')[0]}`;
            const telefones = `${dado.esposo.telefone || ''} / ${dado.esposa.telefone || ''}`;
            const status = dado.status.toUpperCase();
            tableRows.push([casal, telefones, status]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        doc.save(`Lista_Presenca_${tituloEvento}.pdf`);
    }
};
