import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Lock, CheckCircle2 } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Icons for Status
const createCustomIcon = (status: 'locked' | 'active') => {
    const color = status === 'locked' ? '#EF4444' : '#10B981';
    const svgHtml = renderToString(
        <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `2px solid ${color}`
        }}>
            {status === 'locked' ?
                <Lock size={16} color={color} /> :
                <Smartphone size={16} color={color} />
            }
        </div>
    );

    return L.divIcon({
        html: svgHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

interface DeviceMapProps {
    customers: any[];
}

export default function DeviceMap({ customers }: DeviceMapProps) {
    const navigate = useNavigate();

    // Filter customers with valid location
    const devicesWithLocation = customers.filter(c =>
        c.deviceStatus?.lastLocation?.latitude &&
        c.deviceStatus?.lastLocation?.longitude
    );

    // Initial center (India or average of devices)
    const initialCenter: [number, number] = devicesWithLocation.length > 0
        ? [devicesWithLocation[0].deviceStatus.lastLocation.latitude, devicesWithLocation[0].deviceStatus.lastLocation.longitude]
        : [20.5937, 78.9629]; // Default to India center

    return (
        <div className="w-full h-full relative group">
            <div className="w-full h-full rounded-[32px] overflow-hidden">
                <MapContainer
                    center={initialCenter}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />

                    {devicesWithLocation.map((c) => (
                        <Marker
                            key={c.id}
                            position={[c.deviceStatus.lastLocation.latitude, c.deviceStatus.lastLocation.longitude]}
                            icon={createCustomIcon(c.isLocked ? 'locked' : 'active')}
                        >
                            <Popup className="device-popup">
                                <div className="p-1">
                                    <h3 className="text-sm font-black text-slate-800 mb-1">{c.name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${c.isLocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {c.isLocked ? 'Locked' : 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium mb-3">
                                        {c.brand} {c.modelName}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/customers/${c.id}`)}
                                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-colors"
                                    >
                                        Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Float Overlay Info - Repositioned for mobile attribution */}
            <div className="absolute bottom-8 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/20 z-[1000] flex justify-between items-center pointer-events-none shadow-lg">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Locked</span>
                    </div>
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    V3.0.1 RADAR
                </div>
            </div>
        </div>
    );
}
