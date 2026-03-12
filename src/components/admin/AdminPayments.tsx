import { useEffect, useState } from 'react';
import { Save, Smartphone, Wallet, Upload } from 'lucide-react';
import { supabase, isSupabaseConnected } from '../../lib/supabaseClient';

const PAYMENT_CONFIG_ID = 1;
const STORAGE_BUCKET = 'payment-qr';

export default function AdminPayments() {
  const [wechatUrl, setWechatUrl] = useState('');
  const [alipayUrl, setAlipayUrl] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState<'wechat' | 'alipay' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');

  useEffect(() => {
    if (!isSupabaseConnected) {
      setLoading(false);
      return;
    }
    supabase
      .from('payment_config')
      .select('wechat_qr_url, alipay_qr_url, payment_note')
      .eq('id', PAYMENT_CONFIG_ID)
      .single()
      .then((res: { data: unknown; error: { code?: string } | null }) => {
        const { data, error } = res;
        setLoading(false);
        if (error && error.code !== 'PGRST116') {
          console.error('[AdminPayments] load config:', error);
          return;
        }
        if (data) {
          setWechatUrl((data as { wechat_qr_url?: string }).wechat_qr_url || '');
          setAlipayUrl((data as { alipay_qr_url?: string }).alipay_qr_url || '');
          setNote((data as { payment_note?: string }).payment_note || '');
        }
      });
  }, []);

  const handleSave = async () => {
    if (!isSupabaseConnected) {
      alert('未连接 Supabase，无法保存。');
      return;
    }
    setSaveStatus('saving');
    const { error } = await supabase
      .from('payment_config')
      .upsert(
        {
          id: PAYMENT_CONFIG_ID,
          wechat_qr_url: wechatUrl.trim() || null,
          alipay_qr_url: alipayUrl.trim() || null,
          payment_note: note.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) {
      console.error('[AdminPayments] save:', error);
      setSaveStatus('err');
      alert('保存失败：' + (error.message || '请检查权限'));
      return;
    }
    setSaveStatus('ok');
    setTimeout(() => setSaveStatus('idle'), 2000);
    alert('支付配置已保存到云端，前台购买弹窗会显示最新收款码。');
  };

  const handleUpload = async (type: 'wechat' | 'alipay', file: File | null) => {
    if (!file || !isSupabaseConnected) return;
    try {
      setUploading(type);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${type}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadErr) {
        if ((uploadErr as { message?: string }).message?.includes('Bucket not found')) {
          throw new Error('请在 Supabase Dashboard → Storage 中新建名为 payment-qr 的公开桶后再上传。');
        }
        throw uploadErr;
      }
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      if (type === 'wechat') setWechatUrl(publicUrl);
      if (type === 'alipay') setAlipayUrl(publicUrl);
      alert('二维码已上传到 Supabase Storage，请点击「保存」写入配置。');
    } catch (e: any) {
      console.error('upload payment qr failed', e);
      alert(e?.message || '上传失败，请稍后重试。');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-stone-500">
        加载支付配置中…
      </div>
    );
  }

  if (!isSupabaseConnected) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        未配置 Supabase，无法使用云端支付配置。请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">支付管理</h1>
      <p className="text-sm text-stone-500">
        收款码与说明保存在 Supabase，换设备、清缓存后仍生效。请先在 Supabase Dashboard → Storage 中新建公开桶 <code className="bg-stone-200 px-1 rounded">payment-qr</code>。
      </p>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              微信收款码 URL
            </label>
            <input
              type="text"
              value={wechatUrl}
              onChange={(e) => setWechatUrl(e.target.value)}
              placeholder="上传后自动填入，或粘贴图床/公网链接"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="inline-flex items-center px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-600 cursor-pointer hover:bg-stone-50">
                <Upload className="w-3 h-3 mr-1" /> 上传到 Supabase
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleUpload('wechat', e.target.files?.[0] || null)}
                  disabled={uploading === 'wechat'}
                />
              </label>
              {uploading === 'wechat' && <span className="text-xs text-stone-400">上传中…</span>}
            </div>
            {wechatUrl && (
              <div className="mt-2">
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> 预览（微信）
                </div>
                <img src={wechatUrl} alt="WeChat QR" className="w-32 h-32 rounded-xl border border-stone-200 object-cover bg-stone-50" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              支付宝收款码 URL
            </label>
            <input
              type="text"
              value={alipayUrl}
              onChange={(e) => setAlipayUrl(e.target.value)}
              placeholder="上传后自动填入，或粘贴图床/公网链接"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="inline-flex items-center px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-600 cursor-pointer hover:bg-stone-50">
                <Upload className="w-3 h-3 mr-1" /> 上传到 Supabase
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleUpload('alipay', e.target.files?.[0] || null)}
                  disabled={uploading === 'alipay'}
                />
              </label>
              {uploading === 'alipay' && <span className="text-xs text-stone-400">上传中…</span>}
            </div>
            {alipayUrl && (
              <div className="mt-2">
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> 预览（支付宝）
                </div>
                <img src={alipayUrl} alt="Alipay QR" className="w-32 h-32 rounded-xl border border-stone-200 object-cover bg-stone-50" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
            付款说明（展示给用户）
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：请扫码付款后添加微信 xxx 并发送付款截图，我们会在 24 小时内为您手动充值积分。"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saveStatus === 'saving' ? '保存中…' : saveStatus === 'ok' ? '已保存' : '保存到云端'}
        </button>
      </div>
    </div>
  );
}
