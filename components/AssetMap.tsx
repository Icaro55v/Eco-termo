import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Asset } from '../types';

interface AssetMapProps {
  assets: Asset[];
}

const AssetMap: React.FC<AssetMapProps> = ({ assets }) => {
  // Center on Brazil
  const center: [number, number] = [-23.5505, -46.6333];

  const getMarkerIcon = (status: string) => {
    let color = '#10b981'; // green
    if (status === 'warning') color = '#f59e0b';
    if (status === 'alert') color = '#dc2626';

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full min-h-[600px] z-0">
      <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {assets.map((asset) => {
          if (!asset.location) return null;
          return (
            <Marker 
              key={asset.id} 
              position={[asset.location.lat, asset.location.lng]}
              icon={getMarkerIcon(asset.status)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-slate-800">{asset.tagSerial}</h3>
                  <div className="text-xs text-slate-500 mb-2">{asset.modelo} - {asset.area}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">Status:</span>
                    <span className="text-xs uppercase font-bold" style={{ color: asset.status === 'alert' ? 'red' : 'green' }}>{asset.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Dias:</span>
                    <span className="text-xs">{asset.dias}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default AssetMap;