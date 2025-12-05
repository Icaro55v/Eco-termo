export type AssetStatus = 'operational' | 'warning' | 'alert' | 'maintenance';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Asset {
  id: string;
  numero: string;
  modelo: string;
  qtdPlacas: string;
  aplicacao: string;
  area: string;
  tagSerial: string;
  dias: number;
  material: string;
  ultimaManut: string;
  executante?: string;
  observacoes?: string;
  status: AssetStatus;
  efficiency: number;
  location?: GeoLocation;
  importedAt?: string;
}

export interface KPIStats {
  totalAssets: number;
  operational: number;
  warnings: number;
  critical: number;
  avgEfficiency: number;
}

export interface HistoryItem {
  id: string;
  date: string;
  timestamp: number;
  user: string;
  totalAssets: number;
  data: Asset[];
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ASSETS = 'ASSETS',
  REPORTS = 'REPORTS',
  HISTORY = 'HISTORY',
  ANALYSIS = 'ANALYSIS' // Novo modo
}

// Interfaces para o módulo de Análise de Dados
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  dataKey: string;
  categoryKey: string;
  color: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  kpis: { label: string; value: string; trend?: string }[];
  charts: ChartConfig[];
}