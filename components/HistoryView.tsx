import React from 'react';
import { HistoryItem } from '../types';
import { History, RotateCcw, Trash2, ArrowRightLeft, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onCompare: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onRestore, onDelete, onCompare }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Versões</h2>
          <p className="text-slate-500 text-sm">Snapshots automáticos gerados a cada nova importação.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
          <History size={48} className="mx-auto text-slate-300 mb-4"/>
          <p className="text-slate-500 font-medium">Nenhum histórico encontrado.</p>
          <p className="text-xs text-slate-400 mt-1">O histórico será criado automaticamente quando você importar novos dados via CSV.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map(hist => (
            <div key={hist.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-full text-slate-500 group-hover:bg-emerald-50 group-hover:text-[#008200] transition-colors"><History size={24}/></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Backup: {hist.date}</h4>
                  <p className="text-xs text-slate-500 mt-1">Importado por: <span className="font-medium text-slate-700">{hist.user}</span></p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{hist.totalAssets} Ativos</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRestore(hist)} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#008200] text-[#008200] text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                  <RotateCcw size={16}/> Restaurar
                </button>
                
                {/* <button onClick={() => onCompare(hist)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                  <ArrowRightLeft size={16}/> Comparar
                </button> */}

                <button onClick={() => onDelete(hist.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2" title="Apagar Backup">
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;