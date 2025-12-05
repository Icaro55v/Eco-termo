import React, { useState } from 'react';
import { Upload, FileSpreadsheet, BarChart3, RefreshCw, Zap, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { generateDataAnalysis } from '../services/geminiService';
import { AnalysisResult, ChartConfig } from '../types';

const COLORS = ['#008200', '#002e12', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6', '#64748b'];

interface AnalysisViewProps {
  data: any[];
  headers: string[];
  fileName: string;
  analysis: AnalysisResult | null;
  onDataChange: (data: any[], headers: string[], fileName: string) => void;
  onAnalysisChange: (result: AnalysisResult | null) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ 
    data, 
    headers, 
    fileName, 
    analysis, 
    onDataChange, 
    onAnalysisChange 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      
      if (lines.length < 2) return;

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
      const parsedData = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(delimiter);
        if (row.length === rawHeaders.length) {
            const obj: any = {};
            rawHeaders.forEach((head, index) => {
                const val = row[index].trim().replace(/['"]/g, '');
                // Tenta converter para número se possível
                obj[head] = isNaN(Number(val)) ? val : Number(val);
            });
            parsedData.push(obj);
        }
      }

      onDataChange(parsedData, rawHeaders, file.name);
      onAnalysisChange(null); // Reset analysis on new file
    };

    reader.readAsText(file);
  };

  const runAIAnalysis = async () => {
    if (data.length === 0) return;
    setIsAnalyzing(true);
    const result = await generateDataAnalysis(data, headers);
    onAnalysisChange(result);
    setIsAnalyzing(false);
  };

  // Helper para limpar e agregar dados antes de renderizar
  const processChartData = (config: ChartConfig) => {
    // 1. Agrupamento básico
    const grouped: Record<string, number> = {};
    
    data.forEach(d => {
        // Tenta limpar o nome da categoria (ex: pegar primeira parte da string se for muito longa)
        let rawKey = String(d[config.categoryKey] || 'Indefinido');
        
        // Simples heurística de limpeza: Se tiver muitos hífens, pega só o começo
        if (rawKey.split('-').length > 3) {
            rawKey = rawKey.split('-').slice(0, 2).join('-'); 
        }

        const key = rawKey;
        const val = Number(d[config.dataKey]);
        
        // Se dataKey não for número (ex: count), contamos ocorrências
        const valueToAdd = isNaN(val) ? 1 : val;

        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += valueToAdd;
    });

    let processedData = Object.keys(grouped).map(k => ({ 
        name: k, 
        [config.categoryKey]: k,
        [config.dataKey]: grouped[k],
        value: grouped[k] // Para Pie Chart
    }));

    // 2. Ordenação
    processedData.sort((a, b) => b.value - a.value);

    // 3. Regra de "Top 5 + Outros" para evitar poluição visual
    if (processedData.length > 6) {
        const top5 = processedData.slice(0, 5);
        const othersValue = processedData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        
        processedData = [
            ...top5, 
            { 
                name: 'Outros', 
                [config.categoryKey]: 'Outros', 
                [config.dataKey]: othersValue, 
                value: othersValue 
            }
        ];
    }

    return processedData;
  };

  const renderChart = (config: ChartConfig, index: number) => {
    const chartData = processChartData(config);

    return (
      <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-slate-100 flex flex-col h-[400px]">
        <div className="mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {config.type === 'pie' ? <PieIcon size={16}/> : config.type === 'line' ? <TrendingUp size={16}/> : <BarChart3 size={16}/>}
                {config.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">{config.description}</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {config.type === 'bar' ? (
              <BarChart data={chartData} margin={{bottom: 20}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Bar dataKey={config.dataKey} fill={config.color || COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : config.type === 'line' ? (
              <LineChart data={chartData} margin={{bottom: 20}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Line type="monotone" dataKey={config.dataKey} stroke={config.color || COLORS[index % COLORS.length]} strokeWidth={3} dot={{r:4}} />
              </LineChart>
            ) : config.type === 'area' ? (
                <AreaChart data={chartData} margin={{bottom: 20}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                  <Area type="monotone" dataKey={config.dataKey} stroke={config.color || COLORS[index % COLORS.length]} fill={config.color || COLORS[index % COLORS.length]} fillOpacity={0.2} />
                </AreaChart>
            ) : (
              <PieChart>
                <Pie 
                    data={chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header & Upload Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-[#008200]" /> Análise Avançada (BI)
                </h2>
                <p className="text-slate-500 mt-1">Carregue planilhas diversas e deixe a IA gerar dashboards executivos para tomada de decisão.</p>
            </div>
            <div className="flex gap-2">
                 <label className="flex items-center gap-2 px-4 py-2 bg-[#002e12] hover:bg-[#00451b] text-white rounded-lg cursor-pointer transition-all shadow-md font-bold text-sm">
                    <Upload size={16} />
                    {fileName ? 'Alterar Arquivo' : 'Carregar CSV'}
                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv, .txt" />
                 </label>
                 {data.length > 0 && (
                     <button 
                        onClick={runAIAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16} />}
                        Gerar Dashboard
                     </button>
                 )}
            </div>
        </div>

        {fileName && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <FileSpreadsheet className="text-[#008200]" size={20} />
                <span className="font-mono text-slate-700">{fileName}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-bold">{data.length} linhas</span>
                <span className="text-slate-600 font-bold">{headers.length} colunas</span>
            </div>
        )}
      </div>

      {/* Analysis Output */}
      {analysis && (
          <div className="space-y-6">
             {/* Summary & KPIs */}
             <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl border border-indigo-100">
                <h3 className="text-indigo-900 font-bold text-lg mb-2 flex items-center gap-2">
                    <Zap size={18} className="text-indigo-600" /> Insight Executivo
                </h3>
                <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line">{analysis.summary}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysis.kpis.map((kpi, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50">
                            <p className="text-xs text-slate-500 uppercase font-bold">{kpi.label}</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</p>
                            {kpi.trend && <p className="text-xs text-indigo-600 font-medium mt-1">{kpi.trend}</p>}
                        </div>
                    ))}
                </div>
             </div>

             {/* Dynamic Charts Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.charts.map((chart, idx) => renderChart(chart, idx))}
             </div>
          </div>
      )}

      {/* Data Preview Table (Bottom) */}
      {data.length > 0 && !analysis && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700">Pré-visualização de Dados (Primeiras 10 linhas)</h3>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-xs text-left">
                     <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                         <tr>
                             {headers.map(h => <th key={h} className="p-3 border-b border-slate-200 whitespace-nowrap">{h}</th>)}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {data.slice(0, 10).map((row, i) => (
                             <tr key={i} className="hover:bg-slate-50">
                                 {headers.map(h => <td key={`${i}-${h}`} className="p-3 whitespace-nowrap text-slate-600">{row[h]}</td>)}
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-slate-700">A Inteligência Artificial está analisando seus dados...</h3>
            <p className="text-slate-500">Usando modelo avançado para limpeza de dados e cálculo de KPIs...</p>
        </div>
      )}

    </div>
  );
};

export default AnalysisView;