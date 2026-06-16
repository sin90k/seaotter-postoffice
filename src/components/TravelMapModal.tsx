import { useEffect, useMemo, useRef, useState } from 'react';
import { X, MapPin, Download, Navigation, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type LonLat = [number, number];

const WORLD_LANDMASSES: LonLat[][] = [
  [[-168, 72], [-145, 70], [-128, 57], [-115, 49], [-96, 50], [-78, 43], [-66, 25], [-83, 15], [-105, 19], [-123, 31], [-140, 50], [-166, 59]],
  [[-52, 82], [-28, 76], [-20, 65], [-36, 58], [-55, 61], [-70, 72]],
  [[-82, 12], [-66, 9], [-50, -5], [-42, -22], [-53, -48], [-68, -55], [-77, -37], [-79, -12]],
  [[-12, 72], [35, 71], [61, 57], [42, 37], [16, 35], [-10, 43], [-25, 58]],
  [[-18, 36], [11, 38], [35, 31], [51, 10], [43, -31], [20, -35], [4, -25], [-12, -2]],
  [[36, 72], [92, 70], [154, 61], [178, 48], [150, 22], [118, 8], [96, 15], [79, 7], [62, 24], [43, 34], [55, 52]],
  [[100, 8], [125, 19], [145, 12], [137, -8], [113, -8]],
  [[112, -10], [154, -12], [153, -38], [134, -44], [114, -35], [109, -23]],
  [[166, -34], [179, -39], [173, -47], [166, -43]],
  [[-180, -66], [-120, -70], [-40, -68], [40, -70], [120, -67], [180, -70], [180, -86], [-180, -86]],
];

const MIN_TILE_ZOOM = 2;
const MAX_TILE_ZOOM = 3;

type MarkerRow = {
  placeKey?: string;
  label?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  latBucket?: number;
  lngBucket?: number;
  count?: number;
  themeSlug?: string | null;
  postcardLocalId?: string | null;
  locationSource?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
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
  const [activeMarker, setActiveMarker] = useState<MarkerRow | null>(null);
  const [tileZoom, setTileZoom] = useState(MIN_TILE_ZOOM);
  const mapTiles = useMemo(() => {
    const count = 2 ** tileZoom;
    return Array.from({ length: count }).flatMap((_, x) =>
      Array.from({ length: count }).map((__, y) => ({ x, y, z: tileZoom, size: 100 / count }))
    );
  }, [tileZoom]);

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

  const projectMercatorPercent = (lat: number, lng: number) => {
    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const sinLat = Math.sin((clampedLat * Math.PI) / 180);
    const x = ((lng + 180) / 360) * 100;
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * 100;
    return {
      left: `${Math.max(0, Math.min(100, x))}%`,
      top: `${Math.max(0, Math.min(100, y))}%`,
    };
  };

  const drawCanvasMapBase = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const project = (lat: number, lng: number) => ({
      x: x + ((lng + 180) / 360) * w,
      y: y + ((90 - lat) / 180) * h,
    });
    const water = ctx.createLinearGradient(0, y, 0, y + h);
    water.addColorStop(0, '#dceefa');
    water.addColorStop(1, '#cfe6f4');
    ctx.fillStyle = water;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(104, 126, 146, 0.16)';
    ctx.lineWidth = 1;
    for (let lng = -180; lng <= 180; lng += 30) {
      const p = project(0, lng);
      ctx.beginPath();
      ctx.moveTo(p.x, y);
      ctx.lineTo(p.x, y + h);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const p = project(lat, 0);
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x + w, p.y);
      ctx.stroke();
    }
    WORLD_LANDMASSES.forEach((region) => {
      ctx.beginPath();
      region.forEach(([lng, lat], index) => {
        const p = project(lat, lng);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = '#f7f4ed';
      ctx.fill();
      ctx.strokeStyle = 'rgba(124, 116, 101, 0.28)';
      ctx.stroke();
    });
    return project;
  };

  const exportShareImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const project = drawCanvasMapBase(ctx, 40, 100, 1120, 620);
    ctx.fillStyle = '#2563eb';
    markers.forEach((m) => {
      const p = project(m.latitude, m.longitude);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Sea Otter Travel Map', 40, 56);
    ctx.fillStyle = '#475569';
    ctx.font = '22px sans-serif';
    ctx.fillText(`${t.countries}: ${stats.countries_count}   ${t.cities}: ${stats.cities_count}   ${t.postcards}: ${stats.postcards_count}`, 40, 765);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_map_${Date.now()}.png`;
    a.click();
  };

  const getMarkerLabel = (marker: {
    label?: string | null;
    city?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    if (marker.label) return marker.label;
    const named = [marker.city, marker.country].filter(Boolean).join(', ');
    if (named) return named;
    if (Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)) {
      return `${Number(marker.latitude).toFixed(2)}, ${Number(marker.longitude).toFixed(2)}`;
    }
    return language === 'zh' ? '未知地点' : 'Unknown place';
  };

  const loadCityCards = async (marker: MarkerRow) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    setCardsLoading(true);
    setActiveMarker(marker);
    const params = new URLSearchParams();
    if (marker.city) params.set('city', marker.city);
    if (marker.country) params.set('country', marker.country);
    if (!marker.city && !marker.country && marker.latBucket != null && marker.lngBucket != null) {
      params.set('latBucket', String(marker.latBucket));
      params.set('lngBucket', String(marker.lngBucket));
    }
    const url = `/api/travel-map/city-postcards?${params.toString()}`;
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
          <div ref={mapRef} className="relative w-full h-[460px] rounded-xl border border-slate-200 overflow-hidden bg-[#eef3f5] shadow-inner">
            <div className="absolute left-0 top-1/2 w-full aspect-square -translate-y-1/2">
              {mapTiles.map((tile) => (
                <img
                  key={`${tile.z}-${tile.x}-${tile.y}`}
                  src={`https://a.basemaps.cartocdn.com/light_all/${tile.z}/${tile.x}/${tile.y}.png`}
                  alt=""
                  className="absolute object-cover select-none"
                  style={{ left: `${tile.x * tile.size}%`, top: `${tile.y * tile.size}%`, width: `${tile.size}%`, height: `${tile.size}%` }}
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="absolute inset-0">
                {markers.map((m, i) => {
                  const pos = projectMercatorPercent(m.latitude, m.longitude);
                  return (
                    <div
                      key={m.placeKey || `${m.city}-${m.country}-${i}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={{ left: pos.left, top: pos.top }}
                      title={getMarkerLabel(m)}
                      onClick={() => loadCityCards(m)}
                    >
                      <button className="relative block h-5 min-w-5 rounded-full border-[3px] border-white bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.35)] ring-4 ring-blue-500/15 transition-transform hover:scale-110">
                        {(m.count || 0) > 1 && (
                          <span className="absolute -right-2.5 -top-2.5 min-w-4 h-4 px-1 rounded-full bg-slate-900 text-white text-[9px] leading-4 font-bold">
                            {m.count}
                          </span>
                        )}
                      </button>
                      <span className="hidden group-hover:block absolute left-3 top-3 whitespace-nowrap rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-lg">
                        {getMarkerLabel(m)}{(m.count || 0) > 1 ? ` · ${m.count}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.28)),radial-gradient(circle_at_52%_48%,transparent_0,rgba(15,23,42,0.08)_100%)]" />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              {loading ? 'Loading...' : `${stats.postcards_count} ${t.postcards}`}
            </div>
            <div className="absolute right-4 top-4 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-sm">
              <button
                type="button"
                onClick={() => setTileZoom((z) => Math.min(MAX_TILE_ZOOM, z + 1))}
                disabled={tileZoom >= MAX_TILE_ZOOM}
                className="flex h-8 w-8 items-center justify-center border-b border-slate-200 text-slate-600 disabled:opacity-35"
                aria-label="zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTileZoom((z) => Math.max(MIN_TILE_ZOOM, z - 1))}
                disabled={tileZoom <= MIN_TILE_ZOOM}
                className="flex h-8 w-8 items-center justify-center text-slate-600 disabled:opacity-35"
                aria-label="zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
            {!loading && markers.length === 0 && (
              <div className="absolute left-1/2 top-1/2 w-[min(360px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/80 bg-white/92 p-5 text-center shadow-xl backdrop-blur">
                <MapPin className="mx-auto mb-3 h-6 w-6 text-slate-400" />
                <div className="text-sm font-semibold text-slate-900">
                  {language === 'zh' ? '还没有可定位的明信片' : 'No mapped postcards yet'}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">
                  {language === 'zh'
                    ? '生成含 GPS 或可识别地点的照片后，城市会自动合并显示在这里。'
                    : 'Create postcards with GPS or recognizable locations to populate this map.'}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 right-3 rounded bg-white/80 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
              © OpenStreetMap © CARTO
            </div>
          </div>
          {loading && <div className="text-sm text-stone-500">Loading...</div>}
          {(activeMarker || cityCards.length > 0) && (
            <div className="rounded-xl border border-stone-200 p-4">
              <div className="text-sm font-semibold mb-3">
                {t.markerCards}
                {activeMarker ? `: ${getMarkerLabel(activeMarker)}` : ''}
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
                        <div className="truncate text-stone-400">{getMarkerLabel(c)}</div>
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
