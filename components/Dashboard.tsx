import React from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Asset, KPIStats } from '../types';
import KpiCard from './KpiCard';
import { Activity, AlertTriangle, CheckCircle2, Database, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
  stats: KPIStats;
  selectedArea: string;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

const COLORS = {
    operational: '#008200',
    warning: '#f59e0b',
    alert: '#dc2626',
    neutral: '#64748b'
};

const Dashboard: React.FC<DashboardProps> = ({ assets, stats, selectedArea, onFilterChange, activeFilter }) => {
  
  // Calculate grouped data for Advanced Chart (Efficiency vs Days)
  const groupedData = React.useMemo(() => {
    const grouping: Record<string, { name: string; efficiency: number; days: number; count: number }> = {};
    
    assets.forEach(d => {
       // Group by Area if 'All' selected, else by Tag prefix
       const keySource = selectedArea === 'Todas' ? (d.area || 'Indefinido') : (d.tagSerial || 'S/N');
       const key = String(keySource).split('/')[0].split('-')[0].trim(); 
       
       if (!grouping[key]) grouping[key] = { name: key, efficiency: 0, days: 0, count: 0 };
       
       const effVal = d.efficiency;
       const daysVal = d.dias;
       
       grouping[key].efficiency += (isNaN(effVal) ? 0 : effVal);
       grouping[key].days += (isNaN(daysVal) ? 0 : daysVal);
       grouping[key].count++;
    });
    
    return Object.values(grouping).map(a => ({
      name: a.name,
      eficiencia: a.count > 0 ? parseFloat((a.efficiency/a.count).toFixed(1)) : 0,
      dias: a.count > 0 ? parseFloat((a.days/a.count).toFixed(1)) : 0
    })).sort((a,b) => a.eficiencia - b.eficiencia).slice(0, 10); // Top 10 for readability
  }, [assets, selectedArea]);

  const pieData = [
    { name: 'Operacional', value: stats.operational, color: COLORS.operational },
    { name: 'Atenção', value: stats.warnings, color: COLORS.warning },
    { name: 'Crítico', value: stats.critical, color: COLORS.alert }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title={selectedArea === 'Todas' ? "Total Planta" : `Total ${selectedArea}`}
          value={stats.totalAssets} 
          icon={Database} 
          colorClass="bg-white"
          onClick={() => onFilterChange('all')}
        />
        <KpiCard 
          title="Conformidade" 
          value={`${stats.operational}`} 
          icon={ShieldCheck} 
          trend="Equipamentos OK"
          trendUp={true}
          colorClass={`bg-white ${activeFilter === 'operational' ? 'ring-2 ring-[#008200]' : ''}`}
        />
        <KpiCard 
          title="Pontos Críticos" 
          value={stats.critical} 
          icon={AlertTriangle}
          trend="Dias > 8" 
          colorClass="bg-red-50 border-red-100 text-red-700"
        />
        <KpiCard 
          title="Em Atenção" 
          value={stats.warnings} 
          icon={Activity} 
          trend="Dias > 6"
          colorClass="bg-amber-50 border-amber-100 text-amber-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advanced Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="font-bold text-slate-800 text-lg">Performance: {selectedArea}</h3>
               <p className="text-xs text-slate-500">{selectedArea === 'Todas' ? 'Média de Eficiência por Área' : 'Eficiência vs Dias Operados (Top 10)'}</p>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={groupedData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={10} interval={0} />
                 <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} domain={[0, 100]} unit="%" />
                 <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} unit="d" />
                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} cursor={{fill: '#f8fafc'}}/>
                 <Bar yAxisId="left" dataKey="eficiencia" fill="#008200" radius={[4, 4, 0, 0]} barSize={30} fillOpacity={0.9} />
                 <Line yAxisId="right" type="monotone" dataKey="dias" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} />
               </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Status Distribuição</h3>
          <p className="text-xs text-slate-500 mb-4">Visão geral da saúde dos ativos</p>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none -mt-4">
                <span className="block text-4xl font-bold text-slate-800">{stats.totalAssets}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ativos</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;