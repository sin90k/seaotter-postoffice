import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Languages,
  LayoutTemplate,
  Palette,
  Share2,
  SlidersHorizontal,
  Square,
  Ticket,
  Waves,
} from 'lucide-react';
import {
  type ConfigGroup,
  type DesignType,
  type SettingsType,
  type User,
  normalizeSettings,
} from '../App';
import { cn } from '../lib/utils';
import { hasUserBrandingEntitlement } from '../lib/userBranding';
import { localeMeta, SUPPORTED_LOCALES } from '../i18n';

interface Props {
  editingGroupId: string | null;
  configGroups: ConfigGroup[];
  user: User;
  onSave: (group: ConfigGroup) => void;
  onCancel: () => void;
  language: string;
  onFeedback: () => void;
  previewImageUrl?: string | null;
}

const FILTERS: Array<{ id: SettingsType['filter']; label: string }> = [
  { id: 'original', label: '原图' },
  { id: 'polaroid', label: '拍立得' },
  { id: 'film', label: '胶片' },
  { id: 'summer', label: '夏日' },
  { id: 'vintagePostcard', label: '复古明信片' },
  { id: 'cinematic', label: '电影感' },
  { id: 'underwaterRestore', label: '水下修复' },
  { id: 'tropical', label: '清新' },
];

const TYPE_OPTIONS: Array<{
  id: DesignType;
  title: string;
  description: string;
  icon: typeof LayoutTemplate;
}> = [
  { id: 'postcard', title: '明信片', description: '经典明信片，支持寄送', icon: LayoutTemplate },
  { id: 'polaroid', title: '拍立得', description: '复古拍立得，记录瞬间', icon: Square },
  { id: 'ticket', title: '票根', description: '旅行 / 活动票根纪念', icon: Ticket },
  { id: 'diveLog', title: '潜水日志卡', description: '记录一次潜水回忆', icon: Waves },
];

const normalizeTicketHex = (value?: string) => /^#[0-9a-f]{6}$/i.test(value || '') ? value!.toLowerCase() : '#6d5dfc';
const ticketHexToRgb = (value?: string) => {
  const hex = normalizeTicketHex(value).slice(1);
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
};
const ticketRgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`;

type Option<T extends string> = { id: T; label: string; description?: string };

function SegmentedOptions<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5;
}) {
  const gridClass = columns === 5
    ? 'sm:grid-cols-5'
    : columns === 4
      ? 'sm:grid-cols-4'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-3';
  return (
    <div className={cn('grid grid-cols-2 gap-2', gridClass)}>
      {options.map(option => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'min-h-[44px] rounded-lg border px-3 py-2 text-left text-sm transition-colors',
            value === option.id
              ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-200'
              : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
          )}
        >
          <span className="block font-medium">{option.label}</span>
          {option.description && <span className="mt-0.5 block text-xs opacity-70">{option.description}</span>}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-stone-300 accent-stone-900"
      />
    </label>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof LayoutTemplate; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-200 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-stone-500" />
        <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function Step3DesignConfigure({ editingGroupId, configGroups, user, onSave, onCancel, language }: Props) {
  const existingGroup = editingGroupId ? configGroups.find(group => group.id === editingGroupId) : null;
  const [settings, setSettings] = useState<SettingsType>(() => normalizeSettings(existingGroup?.settings));
  const isZh = language.startsWith('zh');
  const canChooseBrand = hasUserBrandingEntitlement(user);
  const hasPersonalBrand = canChooseBrand && user.personalBranding?.enabled === true;
  const ticketCustomHex = normalizeTicketHex(settings.ticketConfig.customAccent);
  const ticketCustomRgb = ticketHexToRgb(ticketCustomHex);

  const patchSettings = (patch: Partial<SettingsType>) => setSettings(previous => ({ ...previous, ...patch }));
  const patchLayout = (patch: Partial<SettingsType['layoutConfig']>) => setSettings(previous => ({
    ...previous,
    layoutConfig: { ...previous.layoutConfig, ...patch },
  }));
  const patchPostcard = (patch: Partial<SettingsType['postcardConfig']>) => setSettings(previous => ({
    ...previous,
    postcardConfig: { ...previous.postcardConfig, ...patch },
  }));
  const patchPolaroid = (patch: Partial<SettingsType['polaroidConfig']>) => setSettings(previous => ({
    ...previous,
    polaroidConfig: { ...previous.polaroidConfig, ...patch },
  }));
  const patchTicket = (patch: Partial<SettingsType['ticketConfig']>) => setSettings(previous => ({
    ...previous,
    ticketConfig: { ...previous.ticketConfig, ...patch },
  }));
  const patchDive = (patch: Partial<SettingsType['diveLogConfig']>) => setSettings(previous => ({
    ...previous,
    diveLogConfig: { ...previous.diveLogConfig, ...patch },
  }));

  const selectDesignType = (designType: DesignType) => {
    setSettings(previous => {
      const next = { ...previous, designType };
      if (designType === 'polaroid') {
        next.size = 'polaroid';
        next.fill = 'bottom-border';
        next.layoutConfig = { ...previous.layoutConfig, aspectRatio: '3:2', imageFit: 'bottomBorder', orientation: 'portrait' };
      } else if (designType === 'ticket') {
        next.size = '4x6';
        next.fill = 'fill';
        next.layoutConfig = { ...previous.layoutConfig, aspectRatio: '3:2', imageFit: 'cover', orientation: 'landscape' };
      } else if (designType === 'diveLog') {
        next.size = '4x6';
        next.fill = 'fill';
        next.layoutConfig = { ...previous.layoutConfig, aspectRatio: '3:2', imageFit: 'cover', orientation: 'landscape' };
      } else {
        next.size = previous.layoutConfig.aspectRatio === '1:1' ? 'square' : '4x6';
        next.fill = previous.layoutConfig.imageFit === 'cover' ? 'fill' : previous.layoutConfig.imageFit === 'bottomBorder' ? 'bottom-border' : 'border';
      }
      return next;
    });
  };

  const backSelection = (() => {
    if (settings.backDesignMode === 'none') return 'none';
    if (settings.designType === 'postcard') {
      if (settings.backDesignMode === 'ai') return 'ai';
      return settings.postcardConfig.backMode;
    }
    if (settings.designType === 'polaroid') return settings.polaroidConfig.backMode || 'postcard';
    if (settings.designType === 'ticket') return settings.ticketConfig.backMode;
    return settings.diveLogConfig.backMode;
  })();

  const setBackSelection = (value: string) => {
    if (value === 'none') {
      patchSettings({ backDesignMode: 'none', aiBackTemplate: false });
      return;
    }
    if (settings.designType === 'postcard') {
      patchPostcard({ backMode: value === 'ai' ? 'postcard' : value as SettingsType['postcardConfig']['backMode'] });
      patchSettings({ backDesignMode: value === 'ai' ? 'ai' : 'template', aiBackTemplate: value === 'ai' });
    } else if (settings.designType === 'polaroid') {
      patchPolaroid({ backMode: value as SettingsType['polaroidConfig']['backMode'] });
      patchSettings({ backDesignMode: 'template', aiBackTemplate: false });
    } else if (settings.designType === 'ticket') {
      patchTicket({ backMode: value as SettingsType['ticketConfig']['backMode'] });
      patchSettings({ backDesignMode: 'template', aiBackTemplate: false });
    } else {
      patchDive({ backMode: value as SettingsType['diveLogConfig']['backMode'] });
      patchSettings({ backDesignMode: 'template', aiBackTemplate: false });
    }
  };

  const setAspect = (value: string) => {
    if (settings.designType === 'ticket') patchTicket({ aspect: value as SettingsType['ticketConfig']['aspect'] });
    if (settings.designType === 'diveLog') patchDive({ aspect: value as SettingsType['diveLogConfig']['aspect'] });
    const aspectRatio = value === '1:1' ? '1:1' : value === '4:3' ? '4:3' : value === '3:2' ? '3:2' : 'custom';
    patchLayout({ aspectRatio, orientation: value === '3:4' ? 'portrait' : 'landscape' });
    if (value === '1:1') patchSettings({ size: 'square' });
    else if (value === '4:3') patchSettings({ size: '5x7' });
    else if (value === '3:4') patchSettings({ size: 'custom', customWidth: 3, customHeight: 4 });
    else if (value === '16:9') patchSettings({ size: 'custom', customWidth: 16, customHeight: 9 });
    else if (value === 'custom') patchSettings({ size: 'custom', customWidth: settings.customWidth || 6, customHeight: settings.customHeight || 4 });
    else patchSettings({ size: '4x6' });
  };

  const setImageFit = (value: SettingsType['layoutConfig']['imageFit']) => {
    patchLayout({ imageFit: value });
    patchSettings({ fill: value === 'cover' ? 'fill' : value === 'bottomBorder' ? 'bottom-border' : 'border' });
  };

  const handleSave = () => {
    const selectedBrand = settings.backBrandingMode ?? 'site';
    const brandingMode = selectedBrand === 'personal' && !hasPersonalBrand
      ? 'site'
      : selectedBrand === 'none' && !canChooseBrand
        ? 'site'
        : selectedBrand;
    const frontMode = settings.designType === 'postcard'
      ? settings.postcardConfig.frontTextMode
      : settings.designType === 'polaroid'
        ? settings.polaroidConfig.captionMode === 'ai'
          ? (settings.polaroidConfig.showLocation === false ? 'titleOnly' : 'titleLocation')
          : (settings.polaroidConfig.showLocation === false ? 'none' : 'locationOnly')
        : settings.designType === 'ticket'
          ? (settings.ticketConfig.aiTitle && settings.ticketConfig.aiLocation ? 'titleLocation' : settings.ticketConfig.aiTitle ? 'titleOnly' : settings.ticketConfig.aiLocation ? 'locationOnly' : 'none')
          : 'none';
    const frontAiMode: SettingsType['frontAiMode'] = frontMode === 'titleOnly'
      ? 'title_only'
      : frontMode === 'locationOnly'
        ? 'location_only'
        : frontMode === 'none'
          ? 'none'
          : 'title_location';
    const normalized = normalizeSettings({
      ...settings,
      frontAiMode,
      aiTitle: frontAiMode !== 'none',
      showDate: settings.designType === 'postcard' ? settings.postcardConfig.showDate : settings.designType === 'polaroid' ? settings.polaroidConfig.showDate : true,
      showLocation: settings.designType === 'postcard' ? settings.postcardConfig.showLocation : settings.designType === 'polaroid' ? settings.polaroidConfig.showLocation !== false : true,
      backBrandingMode: brandingMode,
      backBrandingEnabled: brandingMode !== 'none',
      postcardConfig: { ...settings.postcardConfig, showBrand: brandingMode !== 'none' },
    });
    onSave({ id: 'default', name: 'Global Settings', settings: normalized, photoIds: [] });
  };

  const renderBasicLayout = () => {
    const aspectOptions = settings.designType === 'postcard'
      ? [{ id: '3:2', label: '标准明信片 3:2' }, { id: '4:3', label: '大尺寸 4:3' }, { id: '1:1', label: '方形 1:1' }, { id: 'custom', label: '自定义' }]
      : settings.designType === 'polaroid'
        ? [{ id: '3:2', label: '标准明信片 3:2' }, { id: '1:1', label: '方形 1:1' }, { id: '3:4', label: '竖版 3:4' }]
        : settings.designType === 'ticket'
          ? [{ id: '3:2', label: '标准明信片 3:2' }, { id: '16:9', label: '横版票根 16:9' }, { id: '3:4', label: '竖版票根 3:4' }]
          : [{ id: '3:2', label: '标准明信片 3:2' }, { id: '3:4', label: '竖版 3:4' }, { id: '1:1', label: '方形 1:1' }];
    const currentAspect = settings.designType === 'ticket'
      ? settings.ticketConfig.aspect || '3:2'
      : settings.designType === 'diveLog'
        ? settings.diveLogConfig.aspect || '3:2'
        : settings.layoutConfig.aspectRatio;
    return (
      <>
        <div>
          <div className="mb-2 text-sm font-medium text-stone-700">比例尺寸</div>
          <SegmentedOptions value={currentAspect} options={aspectOptions as Array<Option<any>>} onChange={setAspect} columns={4} />
        </div>
        {settings.designType === 'postcard' && currentAspect === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="宽度（英寸）" value={String(settings.customWidth || 6)} onChange={value => patchSettings({ customWidth: Math.max(1, Number(value) || 1) })} />
            <Field label="高度（英寸）" value={String(settings.customHeight || 4)} onChange={value => patchSettings({ customHeight: Math.max(1, Number(value) || 1) })} />
          </div>
        )}
        {settings.designType === 'postcard' && (
          <>
            <div>
              <div className="mb-2 text-sm font-medium text-stone-700">图片适配</div>
              <SegmentedOptions
                value={settings.layoutConfig.imageFit}
                options={[{ id: 'cover', label: '顶格 Fill' }, { id: 'border', label: '四周留白' }, { id: 'bottomBorder', label: '底部留白' }]}
                onChange={setImageFit}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-stone-700">字体</div>
              <SegmentedOptions value={settings.font} options={[{ id: 'handwritten', label: '手写' }, { id: 'serif', label: '衬线' }, { id: 'sans', label: '无衬线' }]} onChange={font => patchSettings({ font })} />
            </div>
          </>
        )}
        {settings.designType === 'polaroid' && (
          <>
            <Toggle label="底部文字区" checked={settings.polaroidConfig.bottomTextArea} onChange={bottomTextArea => patchPolaroid({ bottomTextArea })} />
            <div className="text-sm text-stone-500">图片将使用拍立得留白，底部白边比其他边更宽。</div>
          </>
        )}
        {settings.designType === 'ticket' && (
          <>
            <div>
              <div className="mb-2 text-sm font-medium text-stone-700">票根方向</div>
              <SegmentedOptions value={settings.ticketConfig.stubPosition} options={[{ id: 'left', label: '左票根' }, { id: 'right', label: '右票根' }]} onChange={stubPosition => patchTicket({ stubPosition })} columns={2} />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-stone-700">图片区域</div>
              <SegmentedOptions value={settings.ticketConfig.imageArea || 'large'} options={[{ id: 'large', label: '大图' }, { id: 'medium', label: '中图' }, { id: 'background', label: '背景图' }]} onChange={imageArea => patchTicket({ imageArea })} />
            </div>
          </>
        )}
        {settings.designType === 'diveLog' && (
          <div>
            <div className="mb-2 text-sm font-medium text-stone-700">图片区域</div>
            <SegmentedOptions value={settings.diveLogConfig.imageArea || 'split'} options={[{ id: 'top', label: '顶部大图' }, { id: 'split', label: '左图右信息' }, { id: 'background', label: '背景图叠加' }]} onChange={imageArea => patchDive({ imageArea })} />
          </div>
        )}
      </>
    );
  };

  const typeFilters = settings.designType === 'polaroid'
    ? FILTERS.filter(item => ['polaroid', 'film', 'summer', 'vintagePostcard'].includes(item.id))
    : settings.designType === 'diveLog'
      ? FILTERS.filter(item => ['original', 'film', 'underwaterRestore', 'tropical', 'cinematic'].includes(item.id))
      : FILTERS;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-950">设计与配置</h2>
        <p className="mt-1 text-sm text-stone-500">选择版面类型后，只显示当前设计需要的设置。</p>
      </div>

      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">设计类型</div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {TYPE_OPTIONS.map(option => {
              const Icon = option.icon;
              const selected = settings.designType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectDesignType(option.id)}
                  className={cn(
                    'min-h-[86px] rounded-lg border p-3 text-left transition-all',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-stone-950"><Icon className="h-4 w-4" />{option.title}</span>
                  <span className="mt-1.5 block text-xs leading-5 text-stone-500">{option.description}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <div className="space-y-7 pb-8">
            <Section icon={LayoutTemplate} title="基础布局">{renderBasicLayout()}</Section>

            <Section icon={Palette} title="样式与视觉">
              {settings.designType === 'polaroid' && (
                <div>
                  <div className="mb-2 text-sm font-medium text-stone-700">边框样式</div>
                  <SegmentedOptions value={settings.polaroidConfig.borderStyle} options={[{ id: 'classic', label: '经典白边' }, { id: 'aged', label: '旧相纸' }, { id: 'soft', label: '柔和圆角' }]} onChange={borderStyle => patchPolaroid({ borderStyle })} />
                </div>
              )}
              {settings.designType === 'ticket' && (
                <>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">设计方式</div>
                    <SegmentedOptions
                      value={settings.ticketConfig.designMode || 'template'}
                      options={[
                        { id: 'template', label: '模板设计', description: '快速生成，可随时切换' },
                        { id: 'ai', label: 'AI 票面设计', description: '生成专属纹理与配色，文字仍清晰可编辑' },
                      ]}
                      onChange={designMode => patchTicket({ designMode })}
                      columns={2}
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">基础模板</div>
                    <SegmentedOptions value={settings.ticketConfig.template || 'travel'} options={[{ id: 'classic', label: '经典票根' }, { id: 'train', label: '复古车票' }, { id: 'cinema', label: '电影票' }, { id: 'travel', label: '旅行票' }, { id: 'event', label: '活动票' }, { id: 'boarding', label: '登机牌' }, { id: 'museum', label: '博物馆票' }]} onChange={template => patchTicket({ template })} columns={4} />
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">配色</div>
                    <SegmentedOptions value={settings.ticketConfig.colorStyle || 'auto'} options={[{ id: 'auto', label: '跟随模板' }, { id: 'blue', label: '旅行蓝' }, { id: 'red', label: '票务红' }, { id: 'forest', label: '森林绿' }, { id: 'mono', label: '黑白' }, { id: 'custom', label: '自定义 RGB' }]} onChange={colorStyle => patchTicket({ colorStyle })} columns={3} />
                  </div>
                  {settings.ticketConfig.colorStyle === 'custom' && (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                      <div className="mb-2 text-sm font-medium text-stone-700">自定义主色</div>
                      <div className="grid gap-2 sm:grid-cols-[44px_110px_repeat(3,minmax(0,1fr))]">
                        <input type="color" value={ticketCustomHex} onChange={event => patchTicket({ customAccent: event.target.value })} className="h-10 w-11 cursor-pointer rounded-md border border-stone-200 bg-white p-1" aria-label="自定义主色" />
                        <input value={ticketCustomHex.toUpperCase()} onChange={event => /^#[0-9a-f]{6}$/i.test(event.target.value.trim()) && patchTicket({ customAccent: event.target.value.trim() })} className="h-10 rounded-md border border-stone-200 bg-white px-2 font-mono text-xs uppercase outline-none focus:border-indigo-500" aria-label="HEX" />
                        {(['r', 'g', 'b'] as const).map(channel => (
                          <label key={channel} className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-stone-400">{channel}</span>
                            <input type="number" min="0" max="255" value={ticketCustomRgb[channel]} onChange={event => {
                              const next = { ...ticketCustomRgb, [channel]: Number(event.target.value) };
                              patchTicket({ customAccent: ticketRgbToHex(next.r, next.g, next.b) });
                            }} className="h-10 w-full rounded-md border border-stone-200 bg-white pl-6 pr-2 text-xs outline-none focus:border-indigo-500" aria-label={channel.toUpperCase()} />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {settings.ticketConfig.imageArea === 'background' && (
                    <div>
                      <div className="mb-2 text-sm font-medium text-stone-700">文字位置</div>
                      <SegmentedOptions value={settings.ticketConfig.textPlacement || 'bottom'} options={[{ id: 'top', label: '顶部' }, { id: 'center', label: '中央' }, { id: 'bottom', label: '底部' }]} onChange={textPlacement => patchTicket({ textPlacement })} />
                    </div>
                  )}
                  <Toggle label="显示撕边" checked={settings.ticketConfig.showPerforation} onChange={showPerforation => patchTicket({ showPerforation })} />
                  <Toggle label="显示条形码 / 二维码占位" checked={settings.ticketConfig.showBarcode} onChange={showBarcode => patchTicket({ showBarcode })} />
                </>
              )}
              {settings.designType === 'diveLog' && (
                <>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">模板</div>
                    <SegmentedOptions value={settings.diveLogConfig.template || 'log'} options={[{ id: 'log', label: '潜水日志' }, { id: 'ticket', label: '潜水票根' }, { id: 'archive', label: '海洋档案' }, { id: 'site', label: '潜点记录' }]} onChange={template => patchDive({ template })} columns={4} />
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">图标风格</div>
                    <SegmentedOptions value={settings.diveLogConfig.iconStyle || 'line'} options={[{ id: 'line', label: '线性图标' }, { id: 'stamp', label: '复古印章' }, { id: 'minimal', label: '极简' }]} onChange={iconStyle => patchDive({ iconStyle })} />
                  </div>
                </>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-stone-700"><span>照片滤镜</span><span>{Math.round((settings.filterIntensity ?? 0.8) * 100)}%</span></div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {typeFilters.map(filter => (
                    <button key={filter.id} type="button" onClick={() => patchSettings({ filter: filter.id })} className={cn('rounded-lg border p-1.5 text-center text-xs transition', settings.filter === filter.id ? 'border-indigo-500 bg-indigo-50 text-indigo-950' : 'border-stone-200 text-stone-600 hover:border-stone-400')}>
                      <img src={`/filter-thumbnails/${filter.id}.png`} alt="" className="mb-1 aspect-square w-full rounded object-cover" />
                      {filter.label}
                    </button>
                  ))}
                </div>
                <input type="range" min={0} max={100} step={5} value={Math.round((settings.filterIntensity ?? 0.8) * 100)} onChange={event => patchSettings({ filterIntensity: Number(event.target.value) / 100 })} className="mt-3 w-full accent-stone-900" aria-label="滤镜强度" />
              </div>
            </Section>

            <Section icon={FileText} title="内容配置">
              {settings.designType === 'postcard' && (
                <>
                  <Field label="摄影师 / 作者" value={settings.authorName || ''} onChange={authorName => patchSettings({ authorName })} placeholder="选填" />
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">AI 正面输出</div>
                    <SegmentedOptions value={settings.postcardConfig.frontTextMode} options={[{ id: 'titleLocation', label: '标题 + 地点' }, { id: 'titleOnly', label: '仅标题' }, { id: 'locationOnly', label: '仅地点' }, { id: 'none', label: '不需要文字' }]} onChange={frontTextMode => patchPostcard({ frontTextMode })} columns={4} />
                  </div>
                  <Toggle label="显示日期" checked={settings.postcardConfig.showDate} onChange={showDate => patchPostcard({ showDate })} />
                  <Toggle label="显示地点" checked={settings.postcardConfig.showLocation} onChange={showLocation => patchPostcard({ showLocation })} />
                </>
              )}
              {settings.designType === 'polaroid' && (
                <>
                  <div>
                    <div className="mb-2 text-sm font-medium text-stone-700">Caption 生成方式</div>
                    <SegmentedOptions value={settings.polaroidConfig.captionMode} options={[{ id: 'manual', label: '手动输入' }, { id: 'ai', label: 'AI 生成' }]} onChange={captionMode => patchPolaroid({ captionMode })} columns={2} />
                  </div>
                  <Field label="底部文字 Caption" value={settings.polaroidConfig.caption} onChange={caption => patchPolaroid({ caption })} placeholder="写下这一刻" />
                  <Toggle label="显示日期" checked={settings.polaroidConfig.showDate} onChange={showDate => patchPolaroid({ showDate })} />
                  <Toggle label="显示地点" checked={settings.polaroidConfig.showLocation !== false} onChange={showLocation => patchPolaroid({ showLocation })} />
                </>
              )}
              {settings.designType === 'ticket' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="标题" value={settings.ticketConfig.ticketTitle} onChange={ticketTitle => patchTicket({ ticketTitle })} />
                    <Field label="地点" value={settings.ticketConfig.location} onChange={location => patchTicket({ location })} />
                    <Field label="日期" type="date" value={settings.ticketConfig.date} onChange={date => patchTicket({ date })} />
                    <Field label="编号" value={settings.ticketConfig.serialNumber} onChange={serialNumber => patchTicket({ serialNumber })} placeholder="自动生成" />
                    <Field label="副标题" value={settings.ticketConfig.subtitle || ''} onChange={subtitle => patchTicket({ subtitle })} />
                    <Field label="备注" value={settings.ticketConfig.note || ''} onChange={note => patchTicket({ note })} />
                  </div>
                  <Toggle label="AI 自动生成标题" checked={settings.ticketConfig.aiTitle !== false} onChange={aiTitle => patchTicket({ aiTitle })} />
                  <Toggle label="AI 自动提取地点 / 场景关键词" checked={settings.ticketConfig.aiLocation !== false} onChange={aiLocation => patchTicket({ aiLocation })} />
                </>
              )}
              {settings.designType === 'diveLog' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="潜点" value={settings.diveLogConfig.location} onChange={location => patchDive({ location })} />
                    <Field label="日期" type="date" value={settings.diveLogConfig.diveDate} onChange={diveDate => patchDive({ diveDate })} />
                    <Field label="最大深度" value={settings.diveLogConfig.depth} onChange={depth => patchDive({ depth })} placeholder="例如 18 m" />
                    <Field label="潜水时长" value={settings.diveLogConfig.duration} onChange={duration => patchDive({ duration })} placeholder="例如 46 min" />
                    <Field label="潜伴" value={settings.diveLogConfig.buddy} onChange={buddy => patchDive({ buddy })} />
                    <Field label="看到的生物" value={settings.diveLogConfig.species} onChange={species => patchDive({ species })} />
                    <Field label="水温" value={settings.diveLogConfig.waterTemp} onChange={waterTemp => patchDive({ waterTemp })} placeholder="例如 24°C" />
                    <Field label="能见度" value={settings.diveLogConfig.visibility} onChange={visibility => patchDive({ visibility })} placeholder="例如 15 m" />
                    <Field label="第几潜" value={settings.diveLogConfig.diveNumber} onChange={diveNumber => patchDive({ diveNumber })} placeholder="例如 #028" />
                  </div>
                  <Toggle label="AI 识别海洋生物" checked={settings.diveLogConfig.aiSpecies === true} onChange={aiSpecies => patchDive({ aiSpecies })} />
                  <Toggle label="AI 自动生成潜水故事" checked={settings.diveLogConfig.aiStory !== false} onChange={aiStory => patchDive({ aiStory })} />
                </>
              )}
            </Section>

            <Section icon={SlidersHorizontal} title="背面设计">
              <SegmentedOptions
                value={backSelection}
                options={(settings.designType === 'postcard'
                  ? [{ id: 'none', label: '仅正面' }, { id: 'postcard', label: '明信片背面' }, { id: 'ai', label: 'AI 背面' }, { id: 'ticket', label: '票根背面' }, { id: 'diveLog', label: '潜水日志背面' }]
                  : settings.designType === 'polaroid'
                    ? [{ id: 'none', label: '仅正面' }, { id: 'postcard', label: '明信片背面' }, { id: 'ticket', label: '票根背面' }]
                    : settings.designType === 'ticket'
                      ? [{ id: 'none', label: '不生成背面' }, { id: 'postcard', label: '明信片背面' }, { id: 'ticket', label: '票根信息背面' }]
                      : [{ id: 'none', label: '不生成背面' }, { id: 'postcard', label: '明信片背面' }, { id: 'diveLog', label: '潜水日志背面' }]) as Array<Option<any>>}
                onChange={setBackSelection}
                columns={settings.designType === 'postcard' ? 5 : 3}
              />
            </Section>

            <Section icon={Share2} title="输出与分享">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-stone-700"><Languages className="h-4 w-4" />输出语言</label>
                <select value={settings.aiLanguage} onChange={event => patchSettings({ aiLanguage: event.target.value })} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-indigo-500">
                  {SUPPORTED_LOCALES.map(locale => <option key={locale} value={localeMeta[locale].aiLanguage}>{localeMeta[locale].nativeName}</option>)}
                </select>
              </div>
              {settings.designType === 'postcard' && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-700">明信片故事</span>
                  <textarea value={settings.cardStory || ''} onChange={event => patchSettings({ cardStory: event.target.value })} rows={3} className="w-full resize-y rounded-lg border border-stone-200 p-3 text-sm outline-none focus:border-indigo-500" placeholder="写下照片背后的故事或心情" />
                </label>
              )}
              <div>
                <div className="mb-2 text-sm font-medium text-stone-700">文案风格</div>
                <SegmentedOptions value={settings.copywritingStyle} options={[{ id: 'auto', label: '自动' }, { id: 'poetic', label: '诗意' }, { id: 'modern', label: '现代' }, { id: 'witty', label: '幽默' }, { id: 'nostalgic', label: '怀旧' }, { id: 'minimalist', label: '极简' }]} onChange={copywritingStyle => patchSettings({ copywritingStyle })} columns={3} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-stone-700">品牌显示</div>
                <SegmentedOptions
                  value={settings.backBrandingMode || 'site'}
                  options={[{ id: 'site', label: '本站品牌' }, { id: 'personal', label: '我的品牌', description: hasPersonalBrand ? undefined : '需先在用户中心启用' }, { id: 'none', label: '不显示' }]}
                  onChange={backBrandingMode => patchSettings({ backBrandingMode, backBrandingEnabled: backBrandingMode !== 'none' })}
                />
              </div>
            </Section>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center">
        <button type="button" onClick={onCancel} className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 font-medium text-stone-600 hover:bg-stone-100"><ArrowLeft className="h-4 w-4" />{isZh ? '返回' : 'Back'}</button>
        <button type="button" onClick={handleSave} className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-stone-900 px-8 font-medium text-white hover:bg-stone-800">{isZh ? '继续' : 'Continue'}<CheckCircle2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
