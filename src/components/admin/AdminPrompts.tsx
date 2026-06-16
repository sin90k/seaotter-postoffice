import { useEffect, useMemo, useState } from 'react';
import { Cloud, History, Loader2, RotateCcw, Save, UploadCloud } from 'lucide-react';
import {
  loadPromptRecords,
  loadPromptVersions,
  publishPrompt,
  rollbackPrompt,
  savePromptDraft,
  type PromptRecord,
  type PromptVersion,
} from '../../lib/promptService';

export default function AdminPrompts() {
  const [list, setList] = useState<PromptRecord[]>([]);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'publish' | 'rollback' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => list.find((item) => item.prompt_id === selectedId) || null,
    [list, selectedId]
  );

  const reload = async (nextSelectedId?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const records = await loadPromptRecords();
      setList(records);
      const activeId = nextSelectedId || selectedId || records[0]?.prompt_id || null;
      setSelectedId(activeId);
      const active = records.find((item) => item.prompt_id === activeId);
      setContent(active?.draft_content || active?.published_content || '');
      if (activeId) setVersions(await loadPromptVersions(activeId));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '读取提示词失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setContent('');
      setVersions([]);
      return;
    }
    const active = list.find((item) => item.prompt_id === selectedId);
    setContent(active?.draft_content || active?.published_content || '');
    loadPromptVersions(selectedId).then(setVersions).catch(() => setVersions([]));
  }, [selectedId, list]);

  const updateSelectedRecord = (next: PromptRecord) => {
    setList((prev) => prev.map((item) => (item.prompt_id === next.prompt_id ? next : item)));
    setContent(next.draft_content || next.published_content || '');
  };

  const handleSaveDraft = async () => {
    if (!selected) return;
    setSaving('draft');
    setMessage(null);
    try {
      await savePromptDraft(selected.prompt_id, content);
      updateSelectedRecord({ ...selected, draft_content: content, updated_at: new Date().toISOString() });
      setMessage('草稿已保存到 Supabase。');
    } catch (e) {
      setMessage(`保存草稿失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSaving(null);
    }
  };

  const handlePublish = async () => {
    if (!selected) return;
    setSaving('publish');
    setMessage(null);
    try {
      const next = await publishPrompt(selected, content);
      updateSelectedRecord(next);
      setVersions(await loadPromptVersions(next.prompt_id));
      setMessage(`已发布 v${next.published_version}。线上 AI 会读取这个版本。`);
    } catch (e) {
      setMessage(`发布失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSaving(null);
    }
  };

  const handleRollback = async (target: PromptVersion) => {
    if (!selected) return;
    setSaving('rollback');
    setMessage(null);
    try {
      const next = await rollbackPrompt(selected, target);
      updateSelectedRecord(next);
      setVersions(await loadPromptVersions(next.prompt_id));
      setMessage(`已回滚到 v${target.version} 的内容，并发布为 v${next.published_version}。`);
    } catch (e) {
      setMessage(`回滚失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">AI 提示词管理</h1>
          <p className="mt-1 text-sm text-stone-500">
            草稿、发布版本和回滚历史保存在 Supabase。发布后，前台 AI 生成会读取已发布版本。
          </p>
        </div>
        <button
          onClick={() => reload().catch(() => {})}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          刷新
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-3">提示词列表</h2>
          <ul className="space-y-1 max-h-[520px] overflow-y-auto">
            {list.map((item) => (
              <li key={item.prompt_id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.prompt_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedId === item.prompt_id ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span className="block font-medium">{item.prompt_name}</span>
                  <span className={`block text-[11px] ${selectedId === item.prompt_id ? 'text-stone-300' : 'text-stone-400'}`}>
                    {item.prompt_type} · v{item.published_version}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      {selected.prompt_name} · {selected.prompt_type}
                    </span>
                    <div className="mt-1 text-xs text-stone-500">
                      已发布 v{selected.published_version}
                      {selected.published_at ? ` · ${new Date(selected.published_at).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={!!saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50 disabled:opacity-60"
                    >
                      {saving === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      保存草稿
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={!!saving || !content.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-sm text-white hover:bg-stone-800 disabled:opacity-60"
                    >
                      {saving === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      发布
                    </button>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
                  placeholder="在这里编辑草稿..."
                />
              </>
            ) : (
              <p className="text-stone-500 text-sm">选择一个提示词进行编辑。</p>
            )}
          </div>

          {selected && (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
                <History className="h-4 w-4" />
                发布历史
              </div>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div key={`${version.prompt_id}-${version.version}`} className="rounded-xl border border-stone-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-stone-800">
                        v{version.version}
                        {version.created_at ? <span className="ml-2 text-xs font-normal text-stone-400">{new Date(version.created_at).toLocaleString()}</span> : null}
                      </div>
                      <button
                        onClick={() => handleRollback(version)}
                        disabled={!!saving || version.content === selected.published_content}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs hover:bg-stone-50 disabled:opacity-40"
                      >
                        {saving === 'rollback' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        回滚到此版
                      </button>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500">
                      {version.content}
                    </div>
                  </div>
                ))}
                {versions.length === 0 && <div className="text-sm text-stone-500">暂无发布历史。</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
