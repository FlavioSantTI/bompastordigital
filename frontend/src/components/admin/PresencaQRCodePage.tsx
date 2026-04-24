import React, { useState, useRef } from 'react';
import { Printer, QrCode, ArrowLeft, Wifi, Download, FileText } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { pdf } from '@react-pdf/renderer';
import { PresenceQRCodeTemplate } from './ReportTemplates';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function PresencaQRCodePage() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState('MANHA'); // Use MANHA, TARDE, NOITE
  const [whatsapp, setWhatsapp] = useState(() => {
    return localStorage.getItem('presenca_whatsapp') || import.meta.env.VITE_DEFAULT_WHATSAPP_NUMBER || '';
  });
  const [lockWhatsapp, setLockWhatsapp] = useState(true);
  const [codigoGerado, setCodigoGerado] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  // Salvar WhatsApp no localStorage sempre que mudar
  React.useEffect(() => {
    localStorage.setItem('presenca_whatsapp', whatsapp);
  }, [whatsapp]);

  const isWhatsappValid = whatsapp.replace(/\D/g, '').length >= 10;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWhatsappValid) {
      setError('Por favor, insira um número de WhatsApp válido para o n8n.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Usuário não autenticado. Faça login novamente.');

      const dataSemHifen = data.replace(/-/g, ''); // 2026-04-25 -> 20260425
      const codigo = `PRESENCA_${dataSemHifen}_${turno}`;
      setCodigoGerado(codigo);

      // Gerar Data URL do QR Code (usando um canvas temporário ou o que já está na tela)
      setTimeout(() => {
        try {
          const canvas = qrRef.current?.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            console.log('QR Code capturado com sucesso');
            setQrCodeDataUrl(dataUrl);
          } else {
            console.warn('Canvas do QR Code não encontrado no ref');
          }
        } catch (err) {
          console.error('Erro ao capturar canvas:', err);
        }
      }, 800);

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
        setError('QR Code gerado, mas falha ao salvar no histórico. ' + dbError.message);
      } else {
        setSuccess('QR Code gerado e registrado no histórico com sucesso!');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar QR Code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    let currentQrUrl = qrCodeDataUrl;

    // Fallback: Tenta capturar o QR Code agora se ainda não tiver
    if (!currentQrUrl) {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        currentQrUrl = canvas.toDataURL('image/png');
        setQrCodeDataUrl(currentQrUrl);
      }
    }

    if (!codigoGerado || !currentQrUrl) {
      setError('O QR Code ainda não está pronto.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const doc = (
        <PresenceQRCodeTemplate 
          codigoGerado={codigoGerado}
          turno={turno}
          data={formatarData(data)}
          qrCodeUrl={currentQrUrl}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_CODE_${codigoGerado}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setError('Falha ao gerar o arquivo PDF: ' + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const urlWhatsapp = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${codigoGerado}`;

  const formatarData = (dataStr: string) => {
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
  };

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
              <div className="relative">
                <input 
                  type="text" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={lockWhatsapp}
                  placeholder="Ex: 5563999999999"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${lockWhatsapp ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300'}`}
                  required
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={lockWhatsapp} 
                  onChange={(e) => setLockWhatsapp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 font-medium">Bloquear edição do WhatsApp</span>
              </label>
              {!isWhatsappValid && !lockWhatsapp && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">Número inválido para o n8n.</p>
              )}
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
              disabled={isGenerating || !isWhatsappValid}
              style={{ backgroundColor: '#f39c12' }}
              className="mt-6 w-full hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:transform-none"
            >
              {isGenerating ? 'Gerando...' : 'Gerar QR Code'}
            </button>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mt-4 border border-red-200">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm mt-4 border border-green-200">{success}</div>}
          </form>
        </div>

        {/* Área de Visualização e Impressão */}
        {codigoGerado ? (
          <div className="flex-1 flex flex-col items-center">
            
            {/* Visualização na Tela (Preview) */}
            <div className="print:hidden w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight mb-2">Registro de Presença</h2>
                <p className="text-gray-500 text-xl font-medium">Aponte a câmera do seu celular para validar</p>
              </div>

              <div ref={qrRef} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <QRCodeCanvas 
                  value={urlWhatsapp} 
                  size={300}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>
              
              <div className="mt-8 text-center bg-gray-50 px-10 py-5 rounded-2xl border border-gray-200 w-full max-w-md">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1 font-semibold">Código da Sessão</p>
                <p className="text-2xl font-black text-gray-900 tracking-wider font-mono">{codigoGerado}</p>
              </div>

              <div className="mt-8 w-full max-w-sm">
                <button
                  onClick={handleDownloadPDF}
                  disabled={!qrCodeDataUrl || isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  <Printer className="w-5 h-5" />
                  {isGeneratingPDF ? 'Gerando PDF...' : !qrCodeDataUrl ? 'Processando QR...' : 'Gerar PDF / Imprimir'}
                </button>
              </div>
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
