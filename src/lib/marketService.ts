import type { CountryConfig } from '../config/countries';

type MarketRow = {
  country_code: string;
  country_name: string;
  language_code: string;
  currency: string;
  region_tier: 'tier1' | 'tier2' | 'tier3';
  is_active: boolean;
};

type PricingRow = {
  market_code: string;
  currency: string;
  price_per_postcard: number;
  credits_per_pack: number;
  pack_price: string;
};

export type MarketDetectResult = {
  detectedCountry: string;
  market: MarketRow | null;
  pricing: PricingRow | null;
};

export const COUNTRY_CODE_TO_CONFIG_COUNTRY: Record<string, string> = {
  CN: 'China',
  US: 'USA',
  UK: 'UK',
  JP: 'Japan',
  KR: 'South Korea',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  SG: 'Singapore',
  AU: 'Australia',
  CA: 'Canada',
  NZ: 'New Zealand',
  TH: 'Thailand',
  ID: 'Indonesia',
  VN: 'Vietnam',
  MY: 'Malaysia',
  PH: 'Philippines',
  TW: 'China',
};

const formatPrice = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  if (n >= 100) return String(Math.round(n));
  return n.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};

export function applyPricingToCountryConfig(base: CountryConfig, pricing: PricingRow | null): CountryConfig {
  if (!pricing || typeof pricing.price_per_postcard !== 'number' || pricing.price_per_postcard <= 0) {
    return base;
  }
  const unit = pricing.price_per_postcard;
  const packs = [
    { amount: 1, discount: 1, labelEn: 'Flexible', save: '' },
    { amount: 10, discount: 0.8, labelEn: 'Starter', save: '20%' },
    { amount: 30, discount: 0.65, labelEn: 'Most Popular', save: '35%' },
    { amount: 60, discount: 0.55, labelEn: 'Best Value', save: '45%' },
  ].map((p, idx) => ({
    amount: p.amount,
    price: formatPrice(unit * p.amount * p.discount),
    label: idx === 2 ? '🔥 Most Popular' : idx === 3 ? '💎 Best Value' : p.labelEn,
    save: p.save,
    popular: idx === 2,
  }));
  return {
    ...base,
    currency: { ...base.currency, code: pricing.currency || base.currency.code },
    pricing: {
      packs,
      vip: formatPrice(unit * 50 * 0.5),
    },
  };
}

export async function detectMarketByIp(): Promise<MarketDetectResult | null> {
  try {
    const res = await fetch('/api/market/detect');
    if (!res.ok) return null;
    const data = (await res.json()) as { detectedCountry?: string; market?: MarketRow | null; pricing?: PricingRow | null };
    return {
      detectedCountry: String(data.detectedCountry || ''),
      market: data.market || null,
      pricing: data.pricing || null,
    };
  } catch {
    return null;
  }
}
