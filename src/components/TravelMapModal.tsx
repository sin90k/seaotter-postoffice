import { useEffect, useMemo, useRef, useState } from 'react';
import { X, MapPin, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type MarkerRow = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  themeSlug?: string | null;
  postcardLocalId?: string | null;
};

type StatsRow = {
  countries_count: number;
  cities_count: number;
  postcards_count: number;
  updated_at?: string | null;
};

type CityCard = {
  postcardId: string;
  postcardLocalId?: string | null;
  title: string;
  frontUrl: string;
  city: string;
  country: string;
  themeSlug?: string | null;
  createdAt?: number | null;
};

type Props = {
  language: string;
  onClose: () => void;
};

export default function TravelMapModal({ language, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [markers, setMarkers] = useState<MarkerRow[]>([]);
  const [stats, setStats] = useState<StatsRow>({
    countries_count: 0,
    cities_count: 0,
    postcards_count: 0,
    updated_at: null,
  });
  const [loading, setLoading] = useState(false);
  const [cityCards, setCityCards] = useState<CityCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [activeMarker, setActiveMarker] = useState<{ city: string; country: string } | null>(null);

  const t = useMemo(
    () =>
      language === 'zh'
        ? {
            title: '旅行地图',
            countries: '已到访国家',
            cities: '已到访城市',
            postcards: '已生成明信片',
            share: '导出地图分享图',
            markerCards: '该城市明信片',
            close: '关闭',
          }
        : {
            title: 'Travel Map',
            countries: 'Countries visited',
            cities: 'Cities visited',
            postcards: 'Postcards created',
            share: 'Export map share image',
            markerCards: 'Postcards in this city',
            close: 'Close',
          },
    [language]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch('/api/travel-map/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!mounted) return;
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setStats(body.stats || { countries_count: 0, cities_count: 0, postcards_count: 0, updated_at: null });
      setMarkers(Array.isArray(body.markers) ? body.markers : []);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const markerToStyle = (lat: number, lng: number) => {
    const left = ((lng + 180) / 360) * 100;
    const top = ((90 - lat) / 180) * 100;
    return { left: `${Math.max(0, Math.min(100, left))}%`, top: `${Math.max(0, Math.min(100, top))}%` };
  };

  const exportShareImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(40, 100, 1120, 620);
    ctx.strokeStyle = '#334155';
    for (let i = 0; i <= 6; i++) {
      const y = 100 + i * (620 / 6);
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(1160, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 12; i++) {
      const x = 40 + i * (1120 / 12);
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    const project = (lat: number, lng: number) => {
      const x = 40 + ((lng + 180) / 360) * 1120;
      const y = 100 + ((90 - lat) / 180) * 620;
      return { x, y };
    };
    ctx.fillStyle = '#38bdf8';
    markers.forEach((m) => {
      const p = project(m.latitude, m.longitude);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Sea Otter Travel Map', 40, 56);
    ctx.font = '24px sans-serif';
    ctx.fillText(`${t.countries}: ${stats.countries_count}   ${t.cities}: ${stats.cities_count}   ${t.postcards}: ${stats.postcards_count}`, 40, 765);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_map_${Date.now()}.png`;
    a.click();
  };

  const loadCityCards = async (city: string, country: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    setCardsLoading(true);
    setActiveMarker({ city, country });
    const url = `/api/travel-map/city-postcards?city=${encodeURIComponent(city || '')}&country=${encodeURIComponent(country || '')}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    setCardsLoading(false);
    if (!res.ok) {
      setCityCards([]);
      return;
    }
    setCityCards(Array.isArray(body.items) ? body.items : []);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100">
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.title}</h2>
          <button onClick={exportShareImage} className="px-3 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t.share}
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-stone-200 p-3 bg-stone-50">
              <div className="text-xs text-stone-500">{t.countries}</div>
              <div className="text-2xl font-bold">{stats.countries_count}</div>
            </div>
            <div className="rounded-xl border border-stone-200 p-3 bg-stone-50">
              <div className="text-xs text-stone-500">{t.cities}</div>
              <div className="text-2xl font-bold">{stats.cities_count}</div>
            </div>
            <div className="rounded-xl border border-stone-200 p-3 bg-stone-50">
              <div className="text-xs text-stone-500">{t.postcards}</div>
              <div className="text-2xl font-bold">{stats.postcards_count}</div>
            </div>
          </div>
          <div ref={mapRef} className="relative w-full h-[460px] rounded-xl border border-stone-200 overflow-hidden bg-gradient-to-b from-sky-100 to-blue-200">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_25%,#fff_0,transparent_30%),radial-gradient(circle_at_70%_65%,#fff_0,transparent_30%)]" />
            <div className="absolute inset-0">
              {markers.map((m, i) => {
                const pos = markerToStyle(m.latitude, m.longitude);
                return (
                  <div
                    key={`${m.city}-${m.country}-${i}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: pos.left, top: pos.top }}
                    title={`${m.city || 'Unknown city'} ${m.country || ''}`}
                    onClick={() => loadCityCards(m.city || '', m.country || '')}
                  >
                    <button className="block w-3 h-3 rounded-full bg-sky-600 border-2 border-white shadow hover:scale-110 transition-transform" />
                    <span className="hidden group-hover:block absolute left-2 top-2 whitespace-nowrap text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                      {m.city || 'Unknown city'}{m.country ? `, ${m.country}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {loading && <div className="text-sm text-stone-500">Loading...</div>}
          {!loading && markers.length === 0 && (
            <div className="text-sm text-stone-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {language === 'zh' ? '暂无可展示的旅行地点数据。' : 'No travel locations yet.'}
            </div>
          )}
          {(activeMarker || cityCards.length > 0) && (
            <div className="rounded-xl border border-stone-200 p-4">
              <div className="text-sm font-semibold mb-3">
                {t.markerCards}
                {activeMarker ? `: ${activeMarker.city || '-'}${activeMarker.country ? `, ${activeMarker.country}` : ''}` : ''}
              </div>
              {cardsLoading && <div className="text-sm text-stone-500">Loading...</div>}
              {!cardsLoading && cityCards.length === 0 && (
                <div className="text-sm text-stone-500">{language === 'zh' ? '暂无该城市明信片。' : 'No postcards for this city.'}</div>
              )}
              {!cardsLoading && cityCards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {cityCards.slice(0, 24).map((c, idx) => (
                    <div key={`${c.postcardId}-${idx}`} className="rounded-lg overflow-hidden border border-stone-200 bg-white">
                      <div className="aspect-[3/2] bg-stone-100">
                        {c.frontUrl ? (
                          <img src={c.frontUrl} alt={c.title || 'postcard'} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="p-2 text-[10px] text-stone-600 truncate" title={c.title}>
                        {c.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
