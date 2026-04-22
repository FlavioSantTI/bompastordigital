import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function PresencaQRCodePage() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState('MANHA'); // Use MANHA, TARDE, NOITE
  const [whatsapp, setWhatsapp] = useState(import.meta.env.VITE_DEFAULT_WHATSAPP_NUMBER || '');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Usuário não autenticado. Faça login novamente.');

      const dataSemHifen = data.replace(/-/g, ''); // 2026-04-25 -> 20260425
      const codigo = `PRESENCA_${dataSemHifen}_${turno}`;
      setCodigoGerado(codigo);

      // Log no Supabase
      const { error: dbError } = await supabase
        .from('qrcode_logs')
        .insert([{
          data_geracao: data,
          turno,
          codigo_gerado: codigo,
          numero_whatsapp: whatsapp,
          usuario_admin_id: userData.user?.id
        }]);

      if (dbError) {
        console.error('Erro ao salvar log no banco:', dbError);
        setError('QR Code gerado, mas falha ao salvar no histórico (). ' + dbError.message);
      } else {
        setSuccess('QR Code gerado e registrado no histórico com sucesso!');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const urlWhatsapp = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${codigoGerado}`;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl print:p-0 print:max-w-none print:m-0">
      
      {/* Cabeçalho Escondido na impressão */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Gerador de Presença</h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 print:block">
        
        {/* Formulário - Escondido na Impressão */}
        <div className="print:hidden flex-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-900 border-b pb-4">
            <QrCode className="w-6 h-6 text-blue-600" /> Configurar Sessão
          </h2>
          
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de Validação (n8n)</label>
              <input 
                type="text" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 5563999999999"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input 
                  type="date" 
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                <select 
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                >
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isGenerating}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
            >
              {isGenerating ? 'Gerando...' : 'Gerar QR Code'}
            </button>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mt-4 border border-red-200">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm mt-4 border border-green-200">{success}</div>}
          </form>
        </div>

        {/* Área de Visualização e Impressão */}
        {codigoGerado ? (
          <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center print:shadow-none print:border-none print:w-full print:h-[90vh] print:p-0 print:m-0">
            
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight mb-2">Registro de Presença</h2>
              <p className="text-gray-500 text-xl font-medium">Aponte a câmera do seu celular para validar</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0">
              <QRCodeSVG 
                value={urlWhatsapp} 
                size={380}
                level="Q"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            
            <div className="mt-10 text-center bg-gray-50 px-10 py-5 rounded-2xl border border-gray-200 print:bg-white print:border-none">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-1 font-semibold">Código da Sessão</p>
              <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-wider font-mono">{codigoGerado}</p>
            </div>

            <div className="print:hidden mt-8 w-full max-w-sm">
              <button 
                onClick={handleImprimir}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Printer className="w-5 h-5" />
                Gerar PDF / Imprimir
              </button>
            </div>
            
            <div className="hidden print:block text-center text-sm text-gray-400 mt-12">
              Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </div>

          </div>
        ) : (
          <div className="print:hidden flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center h-fit">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Nenhum QR Code Gerado</h3>
            <p className="text-gray-500 text-sm max-w-xs">Preencha os dados ao lado e clique em gerar para criar um QR code da sessão.</p>
          </div>
        )}

      </div>
    </div>
  );
}
