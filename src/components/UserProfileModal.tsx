import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Address } from '../App';
import { X, Crown, Zap, LogOut, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';

interface Props {
  user: User;
  setUser: (user: User) => void;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onAdminEnter: () => void;
  language: string;
}

const translations: Record<string, any> = {
  en: {
    vip: 'VIP Member',
    free: 'Free User',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade',
    credits: 'Available Credits',
    creditsLeft: '{count} generations left',
    creditsBreakdown: 'Promo {promo} · Paid {paid}',
    buyMore: 'Buy More',
    retention: 'History Retention',
    logout: 'Log Out',
    permanent: 'Permanent',
    days: 'Days',
    months: 'Months',
    shippingAddresses: 'Shipping Addresses',
    addAddress: 'Add Address',
    noAddresses: 'No addresses saved yet.',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    setDefault: 'Set Default',
    default: 'Default',
    logoutConfirm: 'Are you sure you want to log out?',
  },
  zh: {
    vip: 'VIP 会员',
    free: '免费用户',
    currentPlan: '当前方案',
    upgrade: '升级',
    credits: '可用积分',
    creditsLeft: '剩余 {count} 次生成',
    creditsBreakdown: '赠送 {promo} · 付费 {paid}',
    buyMore: '购买更多',
    retention: '历史记录保存',
    logout: '退出登录',
    permanent: '永久',
    days: '天',
    months: '个月',
    shippingAddresses: '收货地址',
    addAddress: '添加地址',
    noAddresses: '暂无保存的地址。',
    name: '收货人',
    phone: '手机号码',
    address: '详细地址',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    setDefault: '设为默认',
    default: '默认',
    logoutConfirm: '确定要退出登录吗？',
  },
};

export default function UserProfileModal({ user, setUser, onClose, onLogout, onUpgrade, onAdminEnter, language }: Props) {
  const t = { ...translations.en, ...(translations[language] || {}) };
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getLevelDetails = () => {
    switch (user.level) {
      case 'vip':
        return { name: t.vip, icon: Crown, color: 'text-indigo-500', bg: 'bg-indigo-100' };
      default:
        return { name: t.free, icon: Zap, color: 'text-stone-500', bg: 'bg-stone-100' };
    }
  };

  const details = getLevelDetails();
  const Icon = details.icon;

  const handleAddAddress = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', isDefault: false });
    setIsEditingAddress(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingId(addr.id);
    setFormData(addr);
    setIsEditingAddress(true);
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const newAddresses = (user.addresses || []).filter(a => a.id !== id);
      setUser({ ...user, addresses: newAddresses });
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;

    let newAddresses = [...(user.addresses || [])];
    
    if (editingId) {
      newAddresses = newAddresses.map(a => 
        a.id === editingId ? { ...a, ...formData } as Address : a
      );
    } else {
      const newAddr: Address = {
        id: Date.now().toString(),
        name: formData.name!,
        phone: formData.phone!,
        address: formData.address!,
        isDefault: newAddresses.length === 0 || formData.isDefault || false,
      };
      newAddresses.push(newAddr);
    }

    if (formData.isDefault) {
      newAddresses = newAddresses.map(a => ({
        ...a,
        isDefault: a.id === (editingId || newAddresses[newAddresses.length - 1].id)
      }));
    }

    setUser({ ...user, addresses: newAddresses });
    setIsEditingAddress(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-900/50 z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${details.bg}`}>
              <Icon className={`w-8 h-8 ${details.color}`} />
            </div>
            <div>
              <h2 className="text-[clamp(1.25rem,4vw,1.5rem)] font-bold text-stone-900">
                {user.nickname || user.name || (user.phoneNumber ? user.phoneNumber : (user.email ? user.email.split('@')[0] : 'User'))}
              </h2>
              <p className="text-stone-500 text-[clamp(0.75rem,2vw,0.875rem)]">
                {user.phoneNumber || user.email}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {(user.role === 'admin') && (
              <button
                onClick={() => {
                  onClose();
                  onAdminEnter();
                }}
                className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 mb-4 shadow-lg shadow-stone-900/10"
              >
                Admin Panel
              </button>
            )}
            {/* Plan Details */}
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${details.color}`} />
                <div>
                  <p className="text-sm font-medium text-stone-900">{t.currentPlan}</p>
                  <p className="text-xs text-stone-500">{details.name}</p>
                </div>
              </div>
              {user.level !== 'vip' && (
                <button
                  onClick={onUpgrade}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.upgrade}
                </button>
              )}
            </div>

            {/* Credits */}
            {user.level !== 'vip' && (
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">{t.credits}</p>
                    <p className="text-xs text-stone-500">{t.creditsLeft.replace('{count}', String(user.credits ?? (user.promo_credits ?? 0) + (user.paid_credits ?? 0)))}</p>
                    {((user.promo_credits ?? 0) + (user.paid_credits ?? 0)) > 0 && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {(t.creditsBreakdown || 'Promo {promo} · Paid {paid}')
                          .replace('{promo}', String(user.promo_credits ?? 0))
                          .replace('{paid}', String(user.paid_credits ?? 0))}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onUpgrade}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.buyMore}
                </button>
              </div>
            )}

            {/* Addresses Section */}
            <div className="border-t border-stone-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t.shippingAddresses}
                </h3>
                <button
                  onClick={handleAddAddress}
                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isEditingAddress ? (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSaveAddress}
                    className="bg-stone-50 p-4 rounded-2xl space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">{t.name}</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">{t.phone}</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">{t.address}</label>
                      <textarea
                        value={formData.address || ''}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 outline-none text-sm resize-none h-20"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={formData.isDefault || false}
                        onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                      />
                      <label htmlFor="isDefault" className="text-xs text-stone-600">{t.setDefault}</label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-50"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {(user.addresses || []).length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">{t.noAddresses}</p>
                    ) : (
                      (user.addresses || []).map(addr => (
                        <div key={addr.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 relative group">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-stone-900">{addr.name}</span>
                              <span className="text-xs text-stone-500">{addr.phone}</span>
                              {addr.isDefault && (
                                <span className="px-1.5 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                  {t.default}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">{addr.address}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 rounded-xl border-2 border-stone-200 text-stone-600 font-medium hover:bg-stone-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t.logout}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <p className="text-stone-800 font-medium mb-6">{t.logoutConfirm}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onClose();
                    onLogout();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  {t.logout}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
