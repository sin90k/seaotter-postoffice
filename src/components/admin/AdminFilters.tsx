import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  getTravelFilterPresets,
  saveTravelFilterPresets,
  type TravelFilterPreset,
} from '../../lib/filterPresets';

export default function AdminFilters() {
  const [presets, setPresets] = useState<TravelFilterPreset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    const list = getTravelFilterPresets();
    setPresets(list);
    if (list.length > 0) setSelectedId(list[0].id);
  }, []);

  const current = presets.find((p) => p.id === selectedId) || null;

  const updateCurrent = (patch: Partial<TravelFilterPreset>) => {
    if (!current) return;
    setPresets((prev) =>
      prev.map((p) => (p.id === current.id ? { ...p, ...patch } : p))
    );
    setEdited(true);
  };

  const handleSave = () => {
    saveTravelFilterPresets(presets);
    setEdited(false);
    alert('滤镜预设已保存到当前浏览器。换设备或清缓存后不会保留。');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
        照片滤镜
      </h1>
      <p className="text-sm text-stone-500">
        调整每个旅行滤镜的名称、说明和数值参数。当前页面只保存到当前浏览器，适合调试滤镜手感；线上默认滤镜仍来自代码配置。
      </p>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        注意：说明文字只帮助管理者理解风格，不会改变滤镜效果；真正影响画面的只有下方数值参数。
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-3">滤镜列表</h2>
          <ul className="space-y-1 max-h-[400px] overflow-y-auto">
            {presets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedId === p.id
                      ? 'bg-stone-900 text-white'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  {p.name} · <span className="text-xs text-stone-400">{p.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          {current ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
                    显示名称
                  </label>
                  <input
                    type="text"
                    value={current.name}
                    onChange={(e) => updateCurrent({ name: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
                    风格说明
                  </label>
                  <textarea
                    value={current.description}
                    onChange={(e) => updateCurrent({ description: e.target.value })}
                    rows={8}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
                    placeholder="用自然语言描述氛围、色调、对比度、颜色和颗粒感。"
                  />
                  <p className="text-xs text-stone-400">
                    这段说明只用于阅读，不会改变实际滤镜。请调整下方数值参数来改变效果。
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
                    数值参数（-100 到 +100）
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      'exposure',
                      'contrast',
                      'saturation',
                      'temperature',
                      'tint',
                      'fade',
                      'grain',
                      'vignette',
                      'sharpness',
                      'highlight',
                      'shadow',
                    ].map((key) => (
                      <label key={key} className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wide">
                          {key}
                        </span>
                        <input
                          type="number"
                          value={(current.params as any)[key] ?? 0}
                          onChange={(e) =>
                            updateCurrent({
                              params: {
                                ...current.params,
                                [key]: Number(e.target.value || 0),
                              },
                            })
                          }
                          className="border border-stone-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
                          min={-100}
                          max={100}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="mt-4 flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-60"
                disabled={!edited}
              >
                <Save className="w-4 h-4" /> {edited ? '保存修改' : '已保存'}
              </button>
            </>
          ) : (
            <p className="text-sm text-stone-500">请选择一个滤镜进行编辑。</p>
          )}
        </div>
      </div>
    </div>
  );
}
