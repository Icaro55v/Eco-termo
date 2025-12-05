import { Asset } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'T-101',
    numero: '101',
    tagSerial: 'Turbine Generator Alpha',
    modelo: 'Siemens SGT-800',
    qtdPlacas: '0',
    aplicacao: 'Power Generation',
    area: 'São Paulo',
    location: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    status: 'operational',
    efficiency: 92,
    dias: 450,
    material: 'Special Alloy',
    ultimaManut: '2023-11-15',
  },
  {
    id: 'P-204',
    numero: '204',
    tagSerial: 'Hydraulic Pump Beta',
    modelo: 'Bosch Rexroth A10',
    qtdPlacas: '0',
    aplicacao: 'Hydraulics',
    area: 'Rio de Janeiro',
    location: { lat: -22.9068, lng: -43.1729 }, // Rio
    status: 'warning',
    efficiency: 78,
    dias: 7,
    material: 'Carbon Steel',
    ultimaManut: '2023-06-20',
  },
  {
    id: 'C-305',
    numero: '305',
    tagSerial: 'Centrifugal Compressor',
    modelo: 'Atlas Copco ZH',
    qtdPlacas: '0',
    aplicacao: 'Compression',
    area: 'Belo Horizonte',
    location: { lat: -19.9167, lng: -43.9345 }, // Belo Horizonte
    status: 'alert',
    efficiency: 65,
    dias: 12,
    material: 'Cast Iron',
    ultimaManut: '2022-12-01',
  },
  {
    id: 'H-402',
    numero: '402',
    tagSerial: 'Heat Exchanger Unit',
    modelo: 'Alfa Laval T-Series',
    qtdPlacas: '120',
    aplicacao: 'Cooling',
    area: 'Curitiba',
    location: { lat: -25.4284, lng: -49.2733 }, // Curitiba
    status: 'operational',
    efficiency: 95,
    dias: 2,
    material: 'Titanium',
    ultimaManut: '2024-01-10',
  },
  {
    id: 'B-550',
    numero: '550',
    tagSerial: 'Industrial Boiler',
    modelo: 'Cleaver-Brooks CB',
    qtdPlacas: '0',
    aplicacao: 'Steam',
    area: 'Porto Alegre',
    location: { lat: -30.0346, lng: -51.2177 }, // Porto Alegre
    status: 'maintenance',
    efficiency: 0,
    dias: 0,
    material: 'Steel',
    ultimaManut: '2024-02-15',
  }
];

export const STATUS_COLORS = {
  operational: 'bg-emerald-500',
  warning: 'bg-amber-500',
  alert: 'bg-red-600',
  maintenance: 'bg-slate-500'
};

export const STATUS_TEXT_COLORS = {
  operational: 'text-emerald-700 bg-emerald-100',
  warning: 'text-amber-700 bg-amber-100',
  alert: 'text-red-700 bg-red-100',
  maintenance: 'text-slate-700 bg-slate-100'
};