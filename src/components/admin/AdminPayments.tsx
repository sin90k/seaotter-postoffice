import { useEffect, useState } from 'react';
import { Save, Smartphone, Wallet, Upload } from 'lucide-react';

export default function AdminPayments() {
  const [wechatUrl, setWechatUrl] = useState('');
  const [alipayUrl, setAlipayUrl] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState<'wechat' | 'alipay' | null>(null);

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    setWechatUrl(ls.getItem('admin_payment_wechat_qr') || '');
    setAlipayUrl(ls.getItem('admin_payment_alipay_qr') || '');
    setNote(ls.getItem('admin_payment_note') || '');
  }, []);

  const handleSave = () => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    ls.setItem('admin_payment_wechat_qr', wechatUrl.trim());
    ls.setItem('admin_payment_alipay_qr', alipayUrl.trim());
    ls.setItem('admin_payment_note', note.trim());
    alert('支付配置已保存。前台购买弹窗会读取这些收款码。');
  };

  const handleUpload = async (type: 'wechat' | 'alipay', file: File | null) => {
    if (!file) return;
    try {
      setUploading(type);
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/admin/payment-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: type, dataUrl }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }
      const json = await res.json();
      if (type === 'wechat') setWechatUrl(json.url);
      if (type === 'alipay') setAlipayUrl(json.url);
      alert('二维码已上传到服务器并更新链接。');
    } catch (e: any) {
      console.error('upload payment qr failed', e);
      alert(e?.message || '上传失败，请稍后重试。');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">支付管理</h1>
      <p className="text-sm text-stone-500">
        配置前台显示的微信 / 支付宝收款码图片链接，以及给用户看到的付款说明文案（例如转账后如何联系你确认到账）。
      </p>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              微信收款码图片 URL
            </label>
            <input
              type="text"
              value={wechatUrl}
              onChange={(e) => setWechatUrl(e.target.value)}
              placeholder="https://... （或图床地址）"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="inline-flex items-center px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-600 cursor-pointer hover:bg-stone-50">
                <Upload className="w-3 h-3 mr-1" /> 上传本地图片
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
              支付宝收款码图片 URL
            </label>
            <input
              type="text"
              value={alipayUrl}
              onChange={(e) => setAlipayUrl(e.target.value)}
              placeholder="https://... （或图床地址）"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <label className="inline-flex items-center px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-600 cursor-pointer hover:bg-stone-50">
                <Upload className="w-3 h-3 mr-1" /> 上传本地图片
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
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          <Save className="w-4 h-4" /> 保存
        </button>
      </div>
    </div>
  );
}

