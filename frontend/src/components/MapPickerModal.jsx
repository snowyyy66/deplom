import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Фикс иконки Leaflet при сборке через Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [55.751574, 37.573856]; // Москва

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`,
    { headers: { 'Accept-Language': 'ru' } },
  );
  const data = await res.json();
  return data.display_name ?? '';
}

export function MapPickerModal({ open, onClose, onConfirm }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    let destroyed = false;

    const geocode = async (lat, lon) => {
      setGeocoding(true);
      try {
        const addr = await reverseGeocode(lat, lon);
        if (!destroyed) setAddress(addr);
      } catch {
        if (!destroyed) setAddress('');
      } finally {
        if (!destroyed) setGeocoding(false);
      }
    };

    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
    }).addTo(map);

    map.attributionControl.setPrefix('');

    const marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      geocode(lat, lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      geocode(e.latlng.lat, e.latlng.lng);
    });

    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        if (destroyed) return;
        const latlng = [coords.latitude, coords.longitude];
        map.setView(latlng, 15);
        marker.setLatLng(latlng);
        geocode(coords.latitude, coords.longitude);
      },
      () => geocode(DEFAULT_CENTER[0], DEFAULT_CENTER[1]),
    );

    return () => {
      destroyed = true;
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setAddress('');
    };
  }, [open]);

  const handleConfirm = () => {
    if (address) { onConfirm(address); onClose(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[#111] border border-white/10 rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <MapPin className="text-amber-500 w-5 h-5" />
                <span className="text-white font-black uppercase tracking-widest text-sm">
                  Выбрать адрес на карте
                </span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={containerRef} className="w-full h-[420px]" />

            <div className="px-8 py-5 border-t border-white/5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                {geocoding ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span className="text-sm">Определяем адрес...</span>
                  </div>
                ) : address ? (
                  <p className="text-white text-sm font-medium truncate">{address}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Кликните на карте или перетащите метку</p>
                )}
              </div>
              <Button
                disabled={!address || geocoding}
                onClick={handleConfirm}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider rounded-xl px-6 h-11 disabled:opacity-40"
              >
                Подтвердить
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
