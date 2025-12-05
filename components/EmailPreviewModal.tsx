import React, { useState } from 'react';
import { X, Send, Mail, Edit3, CheckCircle2 } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => void;
  initialSubject: string;
  initialBody: string;
  initialRecipient?: string;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onSend, 
  initialSubject, 
  initialBody,
  initialRecipient
}) => {
  const [to, setTo] = useState('manutencao@empresa.com.br');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSent, setIsSent] = useState(false);

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject);
      setBody(initialBody);
      if (initialRecipient) {
        setTo(initialRecipient);
      }
      setIsSent(false);
    }
  }, [isOpen, initialSubject, initialBody, initialRecipient]);

  if (!isOpen) return null;

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      onSend(to, subject, body);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#002e12] p-4 flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2">
                <Mail size={18} /> Preview de E-mail Automático
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {isSent ? (
             <div className="p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={64} className="text-[#008200] animate-bounce mb-4"/>
                <h2 className="text-xl font-bold text-slate-800">E-mail Enviado com Sucesso!</h2>
                <p className="text-slate-500 mt-2">O alerta foi encaminhado para o servidor de disparo.</p>
             </div>
        ) : (
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 text-xs text-amber-800">
                    <Edit3 size={16} className="shrink-0" />
                    <p>Este e-mail foi gerado automaticamente pela IA com base nos dados de ativos críticos. Você pode editar o conteúdo antes de enviar.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Para:</label>
                    <input 
                        type="email" 
                        value={to} 
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm font-medium focus:ring-2 focus:ring-[#008200] outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Assunto:</label>
                    <input 
                        type="text" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm font-medium focus:ring-2 focus:ring-[#008200] outline-none"
                    />
                </div>

                <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Mensagem:</label>
                    <textarea 
                        value={body} 
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded text-sm font-mono h-64 focus:ring-2 focus:ring-[#008200] outline-none resize-none"
                    />
                </div>
            </div>
        )}

        {/* Footer */}
        {!isSent && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSend}
                    className="px-6 py-2 bg-[#008200] hover:bg-[#006000] text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                    <Send size={16} /> Enviar Agora
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreviewModal;