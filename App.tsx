import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { LayoutDashboard, List, Leaf, Upload, History as HistoryIcon, FileText, LogOut, CheckCircle2, AlertCircle, RefreshCw, Mail, BellRing, Send, BarChart3 } from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, set, push, remove, child, update } from 'firebase/database';
import { auth, db } from './services/firebase';
import { generateMaintenanceEmail } from './services/geminiService';

import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import LoginScreen from './components/LoginScreen';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import AnalysisView from './components/AnalysisView'; 
import EmailPreviewModal from './components/EmailPreviewModal';

import { ViewMode, KPIStats, Asset, HistoryItem, AnalysisResult } from './types';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
      active 
        ? 'bg-emerald-50 text-[#008200] shadow-sm border-r-4 border-[#008200]' 
        : 'text-emerald-100 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="hidden lg:block">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Toast State
  const [toasts, setToasts] = useState<any[]>([]);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  // Email Preview Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pendingEmailData, setPendingEmailData] = useState({ subject: '', body: '' });
  const [alertRecipient, setAlertRecipient] = useState('manutencao@ecotermo.com.br');

  // --- STATE FOR ANALYSIS VIEW (LIFTED UP TO PERSIST) ---
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [analysisHeaders, setAnalysisHeaders] = useState<string[]>([]);
  const [analysisFileName, setAnalysisFileName] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
         setAssets([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
        return;
    }

    // Listen to Assets
    const assetsRef = ref(db, `users/${user.uid}/assets`);
    const unsubAssets = onValue(assetsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list: Asset[] = Object.keys(data).map(key => {
               const item = data[key];
               return { 
                  ...item, 
                  id: key
               };
            });
            setAssets(list);
            // Reset maintenance check only if list is empty to avoid loop, 
            // but we want persistent visual alerts handled by AssetList
        } else {
            setAssets([]);
        }
    });

    // Listen to History
    const historyRef = ref(db, `users/${user.uid}/history`);
    const unsubHistory = onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
             const list = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .sort((a: any, b: any) => b.timestamp - a.timestamp);
             setHistoryList(list as HistoryItem[]);
        } else {
            setHistoryList([]);
        }
    });

    return () => {
        unsubAssets();
        unsubHistory();
    };
  }, [user]);

  // --- ASSET CRUD HANDLERS ---
  const handleAddAsset = async (newAssetData: Omit<Asset, 'id'>) => {
      if (!user) return;
      const newRef = push(ref(db, `users/${user.uid}/assets`));
      await set(newRef, { ...newAssetData, id: newRef.key, importedAt: new Date().toISOString() });
      addToast('Sucesso', 'Novo ativo cadastrado com sucesso.', 'success');
  };

  const handleUpdateAsset = async (asset: Asset) => {
      if (!user || !asset.id) return;
      await update(ref(db, `users/${user.uid}/assets/${asset.id}`), asset);
      addToast('Atualizado', `Ativo ${asset.tagSerial} atualizado.`, 'success');
  };

  const handleDeleteAsset = async (id: string) => {
      if (!user || !confirm('Tem certeza que deseja excluir este ativo permanentemente?')) return;
      await remove(ref(db, `users/${user.uid}/assets/${id}`));
      addToast('Excluído', 'Ativo removido do inventário.', 'success');
  };

  // --- INTEGRATION: EMAIL SENDER MOCK ---
  const finalizeSendEmail = async (to: string, subject: string, body: string) => {
    // Aqui seria a integração real com backend (SendGrid, Mailgun, etc.)
    console.log(`--- SIMULAÇÃO DE ENVIO DE E-MAIL ---`);
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Corpo: \n${body}`);
    console.log(`------------------------------------`);
    
    // Atualiza o destinatário padrão para a próxima vez
    setAlertRecipient(to);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setEmailModalOpen(false);
    addToast('E-mail Enviado', `Relatório enviado com sucesso para ${to}.`, 'success');
  };

  const handleOpenEmailPreview = (emailData: { subject: string, body: string }) => {
     setPendingEmailData(emailData);
     setEmailModalOpen(true);
  };

  // --- MAINTENANCE MONITOR (ANNUAL CYCLE) WITH GEMINI ---
  useEffect(() => {
    // Evita rodar se não houver ativos ou se já tiver checado nesta sessão
    if (assets.length === 0 || maintenanceChecked) return;

    const runMaintenanceCheck = async () => {
        // 9 months ~ 270 days
        const nineMonthsInMs = 9 * 30 * 24 * 60 * 60 * 1000; 
        const today = new Date().getTime();
        const alerts: Asset[] = [];

        assets.forEach(asset => {
            if (!asset.ultimaManut || asset.status === 'maintenance') return;
            
            let lastMaintStr = asset.ultimaManut;
            let lastMaintTimestamp = NaN;

            if (lastMaintStr.includes('-')) {
                 lastMaintTimestamp = new Date(lastMaintStr).getTime();
            } 
            else if (lastMaintStr.includes('/')) {
                const parts = lastMaintStr.split('/');
                if (parts.length === 3) {
                    lastMaintTimestamp = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                }
            }

            if (!isNaN(lastMaintTimestamp)) {
                const diff = today - lastMaintTimestamp;
                if (diff >= nineMonthsInMs) {
                    alerts.push(asset);
                }
            }
        });

        if (alerts.length > 0) {
            // Nota Técnica: Para envio 100% automático sem login, seria necessário implementar 
            // uma Cloud Function no Firebase (Backend) que roda via cron job.
            // No front-end, fazemos a checagem assim que o usuário loga.

            const processingId = Date.now();
            setToasts(prev => [...prev, {
                id: processingId,
                title: "IA Gemini",
                message: "Analisando ciclo anual de manutenção...",
                type: 'info'
            }]);

            const emailData = await generateMaintenanceEmail(alerts);
            
            setToasts(prev => prev.filter(t => t.id !== processingId));

            // Notificação persistente (duration: Infinity logic handled in render)
            const id = Date.now();
            setToasts(prev => {
                if (prev.some(t => t.title === "Manutenção Anual")) return prev;
                return [...prev, {
                    id,
                    title: "Manutenção Anual",
                    message: `${alerts.length} ativos críticos > 9 meses. Ação necessária.`,
                    type: 'alert',
                    isPersistent: true, // Flag customizada para não sumir
                    action: { 
                        label: 'Revisar & Enviar Alerta', 
                        onClick: () => handleOpenEmailPreview(emailData)
                    }
                }];
            });
        }
        setMaintenanceChecked(true);
    };

    // Pequeno delay para garantir que a UI carregou antes de iniciar o processamento pesado
    const timer = setTimeout(runMaintenanceCheck, 2000); 
    return () => clearTimeout(timer);
  }, [assets, maintenanceChecked]);


  // --- STATS CALC ---
  const filteredAssets = useMemo(() => {
    let data = assets;
    if (selectedArea !== 'Todas') {
      data = data.filter(a => a.area === selectedArea);
    }
    if (activeFilter !== 'all') {
      data = data.filter(a => a.status === activeFilter);
    }
    return data;
  }, [assets, selectedArea, activeFilter]);

  const stats: KPIStats = useMemo(() => {
    const baseData = selectedArea === 'Todas' ? assets : assets.filter(a => a.area === selectedArea);
    
    const operational = baseData.filter(a => a.status === 'operational').length;
    const warnings = baseData.filter(a => a.status === 'warning').length;
    const critical = baseData.filter(a => a.status === 'alert').length;
    
    let sumEff = 0, countEff = 0;
    baseData.forEach(d => {
      const effVal = parseFloat(String(d.efficiency));
      if (!isNaN(effVal)) { sumEff += effVal; countEff++; }
    });

    return {
      totalAssets: baseData.length,
      operational,
      warnings,
      critical,
      avgEfficiency: countEff > 0 ? Math.round(sumEff / countEff) : 0
    };
  }, [assets, selectedArea]);

  const uniqueAreas = useMemo(() => ['Todas', ...new Set(assets.map(a => a.area).filter(Boolean))].sort(), [assets]);

  // --- HANDLERS ---
  const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'alert') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    // Auto remove normal toasts
    if (type !== 'alert') {
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) throw new Error("File empty");

        // Save History - Normalizing data to ensure it's saved as an object/array structure that we can read later
        if (assets.length > 0) {
            const timestamp = Date.now();
            const historyRef = child(ref(db, `users/${user.uid}/history`), `${timestamp}`);
            await set(historyRef, {
                timestamp,
                date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
                user: user.email,
                totalAssets: assets.length,
                data: assets 
            });
        }

        // Parse CSV Logic (Keep existing logic)
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        const headers = firstLine.toLowerCase().split(separator).map(h => h.replace(/['"]+/g, '').trim());
        
        const findIdx = (terms: string[]) => headers.findIndex(h => terms.some(term => h.includes(term)));
        
        const idx = {
            numero: findIdx(['n.', 'num', 'no.', 'numero']),
            modelo: findIdx(['modelo', 'model']),
            qtdPlacas: findIdx(['placa', 'plate']),
            aplicacao: findIdx(['aplicacao', 'app']),
            area: findIdx(['area', 'setor']),
            tagSerial: findIdx(['tag', 'serie', 'serial', 'equipamento']),
            dias: findIdx(['dias', 'day', 'tempo']),
            material: findIdx(['material', 'mat']),
            ultimaManut: findIdx(['ultima', 'manut', 'date', 'data']),
            efficiency: findIdx(['eficiencia', 'eff', 'efic']),
            executante: findIdx(['executante', 'tecnico', 'resp'])
        };

        const newAssetsData: Record<string, any> = {};

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].replace(/"/g, '').split(separator);
            if (cols.length < 2) continue;

            const getVal = (index: number) => (index > -1 && cols[index]) ? cols[index].trim() : '-';
            const dias = parseInt(getVal(idx.dias)) || 0;
            
            let status = 'operational';
            if (dias > 6) status = 'warning';
            if (dias > 8) status = 'alert';

            let efficiency = status === 'operational' ? 95 : 80;
            const effStr = getVal(idx.efficiency).replace(',', '.').replace('%', '');
            if (effStr && effStr !== '-') efficiency = parseFloat(effStr);

            const newKey = push(ref(db, `users/${user.uid}/assets`)).key!;
            
            newAssetsData[newKey] = {
                id: newKey,
                numero: getVal(idx.numero),
                modelo: getVal(idx.modelo),
                qtdPlacas: getVal(idx.qtdPlacas),
                aplicacao: getVal(idx.aplicacao),
                area: getVal(idx.area),
                tagSerial: getVal(idx.tagSerial),
                dias,
                material: getVal(idx.material),
                ultimaManut: getVal(idx.ultimaManut),
                executante: idx.executante > -1 ? getVal(idx.executante) : 'Externo',
                status,
                efficiency,
                importedAt: new Date().toISOString()
            };
        }

        await set(ref(db, `users/${user.uid}/assets`), newAssetsData);
        addToast('Base Atualizada', 'Novos dados de ativos importados com sucesso.', 'success');
        
      } catch (e: any) {
        addToast("Erro de Leitura", "Falha ao processar o arquivo CSV. Verifique o formato.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestore = async (item: HistoryItem) => {
      if (!user) return;
      if (!confirm(`Restaurar backup de ${item.date}? Isso substituirá os dados atuais.`)) return;
      
      try {
        const assetsRef = ref(db, `users/${user.uid}/assets`);
        const restoredDataObj: Record<string, any> = {};
        
        // Critical Fix: Firebase sometimes returns arrays as objects with index keys. We must normalize.
        const rawData = item.data || [];
        const assetsList = Array.isArray(rawData) ? rawData : Object.values(rawData);

        assetsList.forEach((asset: Asset) => {
             // Ensure every asset has a key
             const key = asset.id || push(assetsRef).key!;
             restoredDataObj[key] = { ...asset, id: key };
        });
        
        await set(assetsRef, restoredDataObj);
        addToast('Restaurado', 'Versão anterior do banco restaurada com sucesso.', 'success');
        setCurrentView(ViewMode.DASHBOARD);
      } catch (e) {
        console.error("Restore failed", e);
        addToast('Erro', 'Falha ao restaurar histórico.', 'error');
      }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!user || !confirm("Confirma exclusão deste snapshot de backup?")) return;
    try {
        // Fix: Ensure path is exact
        const itemRef = ref(db, `users/${user.uid}/history/${id}`);
        await remove(itemRef);
        addToast('Sistema', 'Histórico removido permanentemente.', 'success');
    } catch (error) {
        console.error("Delete Error", error);
        addToast('Erro', 'Não foi possível remover o histórico.', 'error');
    }
  };

  // Shared export function
  const handleExportCSV = () => {
    if (assets.length === 0) {
        addToast('Aviso', 'Sem dados para exportar.', 'info');
        return;
    }
    const headers = ['N', 'Modelo', 'Placas', 'Aplicacao', 'Area', 'Tag', 'Dias', 'Material', 'Ultima Manut', 'Executante', 'Status', 'Eficiencia'];
    const csvContent = [
      headers.join(';'),
      ...assets.map(a => [
        a.numero, a.modelo, a.qtdPlacas, a.aplicacao, a.area, a.tagSerial, a.dias, a.material, a.ultimaManut, a.executante || '-', a.status, a.efficiency
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecotermo_relatorio_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#002e12] text-white"><RefreshCw className="animate-spin"/></div>;
  if (!user) return <LoginScreen onLoginSuccess={() => {}} />;

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden print:overflow-visible print:h-auto print:bg-white font-sans">
        
        {/* Toast Notification Area */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 pointer-events-none print:hidden">
            {toasts.map((t) => (
            <div key={t.id} className={`pointer-events-auto w-96 flex flex-col p-4 rounded-xl shadow-2xl border-l-4 bg-white animate-in slide-in-from-right-10 duration-300 ${
                t.type === 'error' ? 'border-red-500' : 
                t.type === 'alert' ? 'border-red-600 bg-red-50' :
                t.type === 'info' ? 'border-blue-500' :
                'border-[#008200]'
            }`}>
                <div className="flex items-start gap-3">
                   {t.type === 'success' && <CheckCircle2 size={24} className="text-[#008200] shrink-0" />}
                   {t.type === 'info' && <RefreshCw size={24} className="text-blue-500 animate-spin shrink-0" />}
                   {(t.type === 'error' || t.type === 'alert') && <AlertCircle size={24} className="text-red-600 shrink-0" />}
                   
                   <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-sm ${t.type === 'alert' ? 'text-red-800' : 'text-slate-800'}`}>{t.title}</h4>
                        {(t.isPersistent || t.type === 'alert') && (
                            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600"><LogOut size={12} className="rotate-180"/></button>
                        )}
                     </div>
                     <p className={`text-xs mt-1 ${t.type === 'alert' ? 'text-red-700' : 'text-slate-600'}`}>{t.message}</p>
                   </div>
                </div>

                {t.action && (
                  <div className="mt-3 pl-9">
                    {/* Alterado para disparar o modal, não o envio direto */}
                    {t.action.onClick ? (
                       <button 
                         onClick={t.action.onClick}
                         className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-md transition-all hover:shadow-lg w-full text-center bg-red-600 hover:bg-red-700 animate-pulse"
                       >
                         <Mail size={14} /> 
                         {t.action.label}
                       </button>
                    ) : (
                      <a 
                        href={t.action.link} 
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md transition-all hover:shadow-lg w-full text-center"
                      >
                        <Mail size={14} /> {t.action.label}
                      </a>
                    )}
                  </div>
                )}
            </div>
            ))}
        </div>

        {/* Sidebar */}
        <aside className="w-20 lg:w-72 bg-[#002e12] text-white flex flex-col shadow-2xl z-30 transition-all duration-300 print:hidden relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>

          <div className="h-24 flex items-center px-6 border-b border-white/10 gap-3 bg-[#00200a] relative z-10">
            <div className="p-2 bg-white/10 rounded-lg">
               <Leaf className="w-6 h-6 text-[#008200] fill-current" />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-bold text-lg leading-none">EcoTermo</h1>
              <span className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase block mt-1">Enterprise</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-6 relative z-10">
            <div className="px-4 pb-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider hidden lg:block">Módulos</div>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Painel Executivo" 
              active={currentView === ViewMode.DASHBOARD}
              onClick={() => setCurrentView(ViewMode.DASHBOARD)} 
            />
            <SidebarItem 
              icon={List} 
              label="Gestão de Ativos" 
              active={currentView === ViewMode.ASSETS}
              onClick={() => setCurrentView(ViewMode.ASSETS)} 
            />
            <SidebarItem 
              icon={BarChart3} 
              label="Análise Avançada (BI)" 
              active={currentView === ViewMode.ANALYSIS}
              onClick={() => setCurrentView(ViewMode.ANALYSIS)} 
            />
            <SidebarItem 
              icon={HistoryIcon} 
              label="Histórico & Backups" 
              active={currentView === ViewMode.HISTORY}
              onClick={() => setCurrentView(ViewMode.HISTORY)} 
            />
            <SidebarItem 
              icon={FileText} 
              label="Relatórios Oficiais" 
              active={currentView === ViewMode.REPORTS}
              onClick={() => setCurrentView(ViewMode.REPORTS)} 
            />
          </nav>

          <div className="p-6 border-t border-white/10 bg-black/20 space-y-3 relative z-10">
             <button onClick={() => fileInputRef.current?.click()} className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all group">
                <Upload size={16} /> <span className="hidden lg:block">Importar CSV</span>
             </button>
             <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs font-bold py-3 rounded-lg transition-colors">
                <LogOut size={16}/> <span className="hidden lg:block">Sair</span>
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
          
          {/* Header */}
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm print:hidden">
            <div className="flex items-center gap-6">
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                 {currentView === ViewMode.DASHBOARD && 'Painel de Controle'}
                 {currentView === ViewMode.ASSETS && 'Inventário de Ativos'}
                 {currentView === ViewMode.HISTORY && 'Controle de Versão'}
                 {currentView === ViewMode.REPORTS && 'Relatórios Oficiais'}
                 {currentView === ViewMode.ANALYSIS && 'Análise Avançada (BI)'}
               </h2>
               
               {currentView === ViewMode.DASHBOARD && (
                 <div className="relative">
                    <select 
                    value={selectedArea} 
                    onChange={(e) => setSelectedArea(e.target.value)} 
                    className="appearance-none bg-slate-100 text-xs font-bold text-slate-700 py-2 pl-4 pr-10 rounded-lg outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                    {uniqueAreas.map(area => (<option key={area} value={area}>{area}</option>))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-[#008200] rounded-lg text-xs font-bold border border-emerald-100 shadow-sm">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008200]"></span>
                 </span>
                 Sistema Online
               </div>
               
               <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                   <div className="text-right hidden md:block">
                       <p className="text-xs font-bold text-slate-700">{user.email}</p>
                       <p className="text-[10px] text-slate-500 uppercase">Administrador</p>
                   </div>
                   <div className="w-10 h-10 rounded-lg bg-[#002e12] text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {user.email?.substring(0,2).toUpperCase()}
                   </div>
               </div>
            </div>
          </header>

          {/* View Area */}
          <div className="flex-1 overflow-auto p-8 bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
            {currentView === ViewMode.DASHBOARD && (
                <Dashboard 
                    assets={filteredAssets} 
                    stats={stats} 
                    selectedArea={selectedArea}
                    onFilterChange={setActiveFilter}
                    activeFilter={activeFilter}
                />
            )}
            {currentView === ViewMode.ASSETS && (
                <AssetList 
                    assets={filteredAssets} 
                    onExport={handleExportCSV}
                    onEdit={handleUpdateAsset}
                    onDelete={handleDeleteAsset}
                    onCreate={handleAddAsset}
                />
            )}
            {currentView === ViewMode.HISTORY && (
                <HistoryView 
                    history={historyList} 
                    onRestore={handleRestore} 
                    onDelete={handleDeleteHistory}
                    onCompare={() => {}}
                />
            )}
            {currentView === ViewMode.REPORTS && (
                <ReportsView 
                    assets={assets} 
                    stats={stats} 
                    userEmail={user.email || ''} 
                    onExportCSV={handleExportCSV}
                />
            )}
            {currentView === ViewMode.ANALYSIS && (
                <AnalysisView 
                    data={analysisData}
                    headers={analysisHeaders}
                    fileName={analysisFileName}
                    analysis={analysisResult}
                    onDataChange={(d, h, f) => {
                        setAnalysisData(d);
                        setAnalysisHeaders(h);
                        setAnalysisFileName(f);
                    }}
                    onAnalysisChange={setAnalysisResult}
                />
            )}
          </div>
        </main>

        <EmailPreviewModal 
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          onSend={finalizeSendEmail}
          initialSubject={pendingEmailData.subject}
          initialBody={pendingEmailData.body}
          initialRecipient={alertRecipient}
        />
      </div>
      
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
    </HashRouter>
  );
};

export default App;