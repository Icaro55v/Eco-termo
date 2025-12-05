import React from 'react';
import { X, Sparkles, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Assuming we'd install this, but for now we'll render text simply or use a simple parser if strictly no new packages. 
// Note: Since I cannot install react-markdown dynamically, I will render raw text with simple formatting.

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, content, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Maintenance Analysis</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 animate-pulse">Analyzing telemetry data...</p>
            </div>
          ) : (
             <div className="whitespace-pre-line text-slate-700 leading-relaxed font-mono text-sm">
                {/* Fallback simple rendering if markdown lib missing in env */}
                {content.split('\n').map((line, i) => (
                    <p key={i} className={`mb-2 ${line.startsWith('#') ? 'font-bold text-lg text-slate-900' : ''} ${line.startsWith('-') ? 'pl-4' : ''}`}>
                        {line.replace(/[#*]/g, '')}
                    </p>
                ))}
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all font-medium">
            Close
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 transition-all font-medium flex items-center gap-2">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;