import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass = "bg-white", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`${colorClass} rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${colorClass === 'bg-white' ? 'bg-slate-200' : 'bg-white/30'}`}>
          <Icon className={`w-6 h-6 ${colorClass === 'bg-white' ? 'text-slate-600' : 'text-white'}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs mês anterior</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;