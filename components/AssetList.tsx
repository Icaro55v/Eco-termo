import React, { useState } from 'react';
import { Asset } from '../types';
import { Search, Sparkles, Download, Edit, Trash2, CalendarClock, MapPin, Plus, Save, X, Filter } from 'lucide-react';
import { analyzeAssetsWithGemini } from '../services/geminiService';
import AnalysisModal from './AnalysisModal';

interface AssetListProps {
  assets: Asset[];
  onExport: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onCreate: (asset: Omit<Asset, 'id'>) => void;
}

const AssetList: React.FC<AssetListProps> = ({ assets, onExport, onEdit, onDelete, onCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisContent, setAnalysisContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // States for Edit/Create Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<Asset>>({});
  const [isNewAsset, setIsNewAsset] = useState(false);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.tagSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.aplicacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.area?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = filterDate ? asset.ultimaManut === filterDate : true;

    return matchesSearch && matchesDate;
  });

  const handleRunAnalysis = async () => {
    setIsModalOpen(true);
    setIsAnalyzing(true);
    const result = await analyzeAssetsWithGemini(assets);
    setAnalysisContent(result);
    setIsAnalyzing(false);
  };

  const openNewAssetModal = () => {
    setIsNewAsset(true);
    setCurrentAsset({
        status: 'operational',
        dias: 0,
        efficiency: 100,
        ultimaManut: new Date().toISOString().split('T')[0],
        executante: 'Interno'
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setIsNewAsset(false);
    setCurrentAsset({ ...asset });
    setIsEditModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
      e.preventDefault();
      if (isNewAsset) {
          onCreate(currentAsset as Asset);
      } else {
          onEdit(currentAsset as Asset);
      }
      setIsEditModalOpen(false);
  };

  const getBadgeStyle = (status: string) => {
    switch(status) {
      case 'operational': return 'bg-emerald-100 text-[#008200] border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'alert': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const calculateMonthsSince = (dateString?: string) => {
    if (!dateString) return 0;
    
    let date = new Date(dateString);
    // Handle DD/MM/YYYY
    if (isNaN(date.getTime()) && dateString.includes('/')) {
        const parts = dateString.split('/');
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    if (isNaN(date.getTime())) return 0;

    const today = new Date();
    let months = (today.getFullYear() - date.getFullYear()) * 12;
    months -= date.getMonth();
    months += today.getMonth();
    return months <= 0 ? 0 : months;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 h-full flex flex-col">
      
      {/* Header Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <CalendarClock className="text-[#008200]" size={20}/>
             Gestão de Ativos & Manutenção
           </h2>
           <p className="text-xs text-slate-500">Controle individual de {assets.length} equipamentos. Monitoramento de ciclo anual.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#008200] text-slate-600"
                  title="Filtrar por data de manutenção"
                />
             </div>
             {filterDate && (
                 <button onClick={() => setFilterDate('')} className="text-red-500 hover:text-red-700 text-xs font-bold underline">Limpar Data</button>
             )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar TAG, Modelo, Área..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#008200] w-full md:w-48 lg:w-64"
            />
          </div>
          
          <button 
            onClick={openNewAssetModal}
            className="flex items-center gap-2 px-3 py-2 bg-[#008200] hover:bg-[#006000] text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>

          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-[#008200] hover:border-[#008200] text-xs font-bold rounded-lg transition-all"
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button 
            onClick={handleRunAnalysis}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            IA
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-b border-slate-200 w-24">Ações</th>
              <th className="p-4 border-b border-slate-200">TAG / Série</th>
              <th className="p-4 border-b border-slate-200">Modelo</th>
              <th className="p-4 border-b border-slate-200">Localização</th>
              <th className="p-4 border-b border-slate-200">Executante</th>
              <th className="p-4 border-b border-slate-200 text-center">Última Manut.</th>
              <th className="p-4 border-b border-slate-200 text-center">Ciclo (Meses)</th>
              <th className="p-4 border-b border-slate-200 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAssets.length === 0 ? (
               <tr>
                   <td colSpan={8} className="p-8 text-center text-slate-400">
                       Nenhum ativo encontrado para os filtros selecionados.
                   </td>
               </tr>
            ) : filteredAssets.map((asset) => {
              const months = calculateMonthsSince(asset.ultimaManut);
              const isAnnualDue = months >= 9;
              const isCritical = months >= 12;
              
              const rowClass = isAnnualDue ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50";
              const borderClass = isAnnualDue ? "border-l-4 border-l-red-500" : "";

              return (
                <tr key={asset.id} className={`${rowClass} ${borderClass} transition-colors group`}>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEditModal(asset)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit size={14}/>
                    </button>
                    <button onClick={() => onDelete(asset.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                        <Trash2 size={14}/>
                    </button>
                  </td>
                  <td className="p-4 font-mono text-[#008200] font-bold text-sm">{asset.tagSerial}</td>
                  <td className="p-4 font-medium text-slate-600">{asset.modelo}</td>
                  <td className="p-4 text-slate-700">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400"/>
                        {asset.area}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{asset.executante || '-'}</td>
                  <td className="p-4 text-center text-slate-500 font-medium">{asset.ultimaManut}</td>
                  <td className="p-4 text-center">
                     <div className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full border w-24 transition-all ${
                        isCritical ? 'bg-red-600 text-white border-red-700 font-bold shadow-md scale-105' :
                        isAnnualDue ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold ring-2 ring-amber-200' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                     }`}>
                        {isAnnualDue && <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-1" title="Ação Requerida"></div>}
                        <CalendarClock size={12} />
                        {months} M
                     </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded border uppercase font-bold text-[10px] ${getBadgeStyle(asset.status)}`}>
                      {asset.status === 'operational' ? 'Operacional' : asset.status === 'warning' ? 'Atenção' : asset.status === 'alert' ? 'Crítico' : 'Manutenção'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Asset Edit/Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{isNewAsset ? 'Adicionar Novo Ativo' : 'Editar Ativo'}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">TAG / Serial</label>
                            <input required type="text" className="w-full border rounded p-2 text-sm" value={currentAsset.tagSerial || ''} onChange={e => setCurrentAsset({...currentAsset, tagSerial: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Modelo</label>
                            <input required type="text" className="w-full border rounded p-2 text-sm" value={currentAsset.modelo || ''} onChange={e => setCurrentAsset({...currentAsset, modelo: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Área / Local</label>
                            <input required type="text" className="w-full border rounded p-2 text-sm" value={currentAsset.area || ''} onChange={e => setCurrentAsset({...currentAsset, area: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Aplicação</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={currentAsset.aplicacao || ''} onChange={e => setCurrentAsset({...currentAsset, aplicacao: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Última Manutenção</label>
                            <input required type="date" className="w-full border rounded p-2 text-sm" value={currentAsset.ultimaManut || ''} onChange={e => setCurrentAsset({...currentAsset, ultimaManut: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Executante</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={currentAsset.executante || ''} onChange={e => setCurrentAsset({...currentAsset, executante: e.target.value})} placeholder="Ex: Interno, Terceiro" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                            <select className="w-full border rounded p-2 text-sm bg-white" value={currentAsset.status || 'operational'} onChange={e => setCurrentAsset({...currentAsset, status: e.target.value as any})}>
                                <option value="operational">Operacional</option>
                                <option value="warning">Atenção</option>
                                <option value="alert">Crítico</option>
                                <option value="maintenance">Em Manutenção</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Eficiência (%)</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={currentAsset.efficiency || 0} onChange={e => setCurrentAsset({...currentAsset, efficiency: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold text-xs">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#008200] hover:bg-[#006000] text-white rounded font-bold text-xs flex items-center gap-2">
                            <Save size={16}/> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <AnalysisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={analysisContent}
        isLoading={isAnalyzing}
      />
    </div>
  );
};

export default AssetList;