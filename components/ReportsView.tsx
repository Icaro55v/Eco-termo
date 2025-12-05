import React from 'react';
import { Asset, KPIStats } from '../types';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';

interface ReportsViewProps {
  assets: Asset[];
  stats: KPIStats;
  userEmail: string;
  onExportCSV?: () => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ assets, stats, userEmail, onExportCSV }) => {
  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 print:block print:w-full">
       <div className="w-full max-w-[210mm] bg-white shadow-2xl min-h-[297mm] p-12 relative print:shadow-none print:w-full print:p-8 print:m-0 print:max-w-none">
          <div className="flex justify-between items-start border-b-2 border-[#002e12] pb-6 mb-8 print:mb-6 print:pb-4">
             <div>
               <h1 className="text-3xl font-bold text-[#002e12] uppercase tracking-tight print:text-2xl">Relatório Técnico</h1>
               <p className="text-slate-500 mt-1 font-medium">Controle de Trocadores de Calor & Food Safety</p>
             </div>
             <div className="text-right">
               <div className="text-2xl font-bold text-[#008200] tracking-tighter mb-1">EcoTermo</div>
               <p className="text-xs text-slate-400 font-mono">EMISSÃO: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
               <p className="text-xs text-slate-400 font-mono">RESP: {userEmail}</p>
             </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-100 print:bg-transparent print:border-slate-300 print:mb-6 print:p-4">
            <h4 className="text-sm font-bold text-[#002e12] uppercase mb-4 border-b border-slate-200 pb-2">Resumo Executivo</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
               <div><span className="block text-3xl font-bold text-slate-800 print:text-xl">{stats.totalAssets}</span><span className="text-[10px] uppercase font-bold text-slate-400">Ativos Totais</span></div>
               <div><span className={`block text-3xl font-bold print:text-xl ${stats.critical > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.critical}</span><span className="text-[10px] uppercase font-bold text-slate-400">Pontos Críticos</span></div>
               <div><span className="block text-3xl font-bold text-[#008200] print:text-xl">100%</span><span className="text-[10px] uppercase font-bold text-slate-400">Material OK</span></div>
               <div><span className="block text-3xl font-bold text-blue-600 print:text-xl">{stats.avgEfficiency}%</span><span className="text-[10px] uppercase font-bold text-slate-400">Eficiência Média</span></div>
            </div>
          </div>
          <div className="mb-8">
            <h4 className="text-sm font-bold text-[#002e12] uppercase mb-4 border-b border-slate-200 pb-2">Detalhamento Técnico</h4>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-[#002e12] text-white font-bold uppercase print:bg-slate-200 print:text-black">
                <tr>
                  <th className="p-2 border border-slate-400 text-center w-10">N°</th>
                  <th className="p-2 border border-slate-400">Modelo</th>
                  <th className="p-2 border border-slate-400">Tag / Série</th>
                  <th className="p-2 border border-slate-400">Localização</th>
                  <th className="p-2 border border-slate-400">Executante</th>
                  <th className="p-2 border border-slate-400 text-center">Última Manut.</th>
                  <th className="p-2 border border-slate-400 text-center">Dias Oper.</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((d, i) => (
                  <tr key={`rep-full-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-300 text-center font-bold">{d.numero || i + 1}</td>
                    <td className="p-2 border border-slate-300">{d.modelo}</td>
                    <td className="p-2 border border-slate-300 font-mono text-[10px]">{d.tagSerial}</td>
                    <td className="p-2 border border-slate-300">{d.area}</td>
                    <td className="p-2 border border-slate-300">{d.executante || '-'}</td>
                    <td className="p-2 border border-slate-300 text-center">{d.ultimaManut}</td>
                    <td className={`p-2 border border-slate-300 text-center font-bold ${d.dias > 8 ? 'text-red-600 bg-red-50' : ''}`}>{d.dias}</td>
                    <td className="p-2 border border-slate-300 text-center text-[10px] font-bold uppercase">
                        <span className={d.status === 'operational' ? 'text-[#008200]' : d.status === 'alert' ? 'text-red-600' : 'text-amber-600'}>
                            {d.status === 'operational' ? 'OK' : d.status === 'alert' ? 'CRÍTICO' : 'ATENÇÃO'}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
       <div className="mt-8 mb-12 flex flex-col md:flex-row gap-4 print:hidden">
         <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#002e12] text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-[#00451b] transition-transform hover:-translate-y-1">
           <Printer size={20} /> IMPRIMIR / SALVAR PDF
         </button>
         {onExportCSV && (
            <button onClick={onExportCSV} className="flex items-center gap-2 bg-white border-2 border-[#002e12] text-[#002e12] px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-transform hover:-translate-y-1">
                <FileSpreadsheet size={20} /> BAIXAR DADOS (CSV)
            </button>
         )}
       </div>
       <p className="text-xs text-slate-400 print:hidden mb-12 max-w-md text-center">Nota: Para salvar como PDF, clique em Imprimir e selecione "Salvar como PDF" nas opções de destino da impressora.</p>
    </div>
  );
};

export default ReportsView;