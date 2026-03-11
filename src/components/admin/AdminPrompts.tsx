import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { listPromptIds, getPrompt, savePrompt, getPromptLastModified, type PromptType } from '../../lib/promptService';

export default function AdminPrompts() {
  const [list, setList] = useState<{ prompt_id: string; prompt_name: string; prompt_type: PromptType }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [lastModified, setLastModified] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setList(listPromptIds());
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setContent('');
      setLastModified(null);
      return;
    }
    setContent(getPrompt(selectedId));
    setLastModified(getPromptLastModified(selectedId));
  }, [selectedId]);

  const handleSave = () => {
    if (!selectedId) return;
    savePrompt(selectedId, content);
    setLastModified(Date.now());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">AI 提示词管理</h1>
      <p className="text-sm text-stone-500">
        编辑并保存提示词。保存后会覆盖默认配置文件中的内容，无需重新部署即可生效。
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-3">提示词列表</h2>
          <ul className="space-y-1 max-h-[400px] overflow-y-auto">
            {list.map((item) => (
              <li key={item.prompt_id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.prompt_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedId === item.prompt_id ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  {item.prompt_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          {selectedId ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                  {list.find((p) => p.prompt_id === selectedId)?.prompt_name} · {list.find((p) => p.prompt_id === selectedId)?.prompt_type}
                </span>
                {lastModified != null && (
                  <span className="text-xs text-stone-400">Last modified: {new Date(lastModified).toLocaleString()}</span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
                placeholder="在这里编辑提示词内容..."
              />
              <button
                onClick={handleSave}
                className="mt-4 flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                <Save className="w-4 h-4" /> {saved ? '已保存' : '保存'}
              </button>
            </>
          ) : (
            <p className="text-stone-500 text-sm">在左侧选择一个提示词进行编辑。</p>
          )}
        </div>
      </div>
    </div>
  );
}
