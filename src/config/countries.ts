export interface CountryConfig {
  country: string;
  nativeCountry: string;
  language: string;
  nativeLanguage: string;
  langCode: string;
  login: string[];
  payment: string[];
  imageRules: {
    resize: string;
    template: string;
    overlay: string;
  };
  currency: {
    symbol: string;
    code: string;
  };
  pricing: {
    packs: {
      amount: number;
      price: string;
      label: string;
      save: string;
      popular?: boolean;
    }[];
    vip: string;
  };
}

export const countriesConfig: CountryConfig[] = [
  {
    country: "China",
    nativeCountry: "中国大陆",
    language: "Chinese (Simplified)",
    nativeLanguage: "简体中文",
    langCode: "zh",
    login: ["Email+Password", "Phone+SMS", "WeChat/QQ/Weibo"],
    payment: ["Alipay", "WeChat Pay", "Credit/Debit Card"],
    imageRules: { resize: "1480x1000", template: "cn_standard", overlay: "red_stamp" },
    currency: { symbol: "¥", code: "CNY" },
    pricing: {
      packs: [
        { amount: 1, price: "0.99", label: "灵活试用", save: "" },
        { amount: 10, price: "8", label: "入门尝鲜", save: "19%" },
        { amount: 30, price: "19", label: "🔥 最受欢迎", save: "36%", popular: true },
        { amount: 60, price: "32", label: "💎 超值首选", save: "46%" }
      ],
      vip: "32"
    }
  },
  {
    country: "Australia",
    nativeCountry: "Australia",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1200x1800", template: "au_standard", overlay: "sun_flare" },
    currency: { symbol: "$", code: "AUD" },
    pricing: {
      packs: [
        { amount: 1, price: "0.25", label: "Flexible", save: "" },
        { amount: 10, price: "1.9", label: "Starter", save: "24%" },
        { amount: 30, price: "4.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "7.9", label: "💎 Best Value", save: "47%" }
      ],
      vip: "7.9"
    }
  },
  {
    country: "Canada",
    nativeCountry: "Canada",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1200x1800", template: "us_4x6", overlay: "maple_leaf_subtle" },
    currency: { symbol: "$", code: "CAD" },
    pricing: {
      packs: [
        { amount: 1, price: "0.20", label: "Flexible", save: "" },
        { amount: 10, price: "1.5", label: "Starter", save: "25%" },
        { amount: 30, price: "3.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "6.5", label: "💎 Best Value", save: "46%" }
      ],
      vip: "6.5"
    }
  },
  {
    country: "France",
    nativeCountry: "France",
    language: "French",
    nativeLanguage: "Français",
    langCode: "fr",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1050x1485", template: "eu_a6", overlay: "vintage_border" },
    currency: { symbol: "€", code: "EUR" },
    pricing: {
      packs: [
        { amount: 1, price: "0.15", label: "Flexible", save: "" },
        { amount: 10, price: "1.2", label: "Starter", save: "20%" },
        { amount: 30, price: "2.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "4.9", label: "💎 Best Value", save: "45%" }
      ],
      vip: "4.9"
    }
  },
  {
    country: "Germany",
    nativeCountry: "Deutschland",
    language: "German",
    nativeLanguage: "Deutsch",
    langCode: "de",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1050x1485", template: "eu_a6", overlay: "clean_white" },
    currency: { symbol: "€", code: "EUR" },
    pricing: {
      packs: [
        { amount: 1, price: "0.15", label: "Flexible", save: "" },
        { amount: 10, price: "1.2", label: "Starter", save: "20%" },
        { amount: 30, price: "2.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "4.9", label: "💎 Best Value", save: "45%" }
      ],
      vip: "4.9"
    }
  },
  {
    country: "Indonesia",
    nativeCountry: "Indonesia",
    language: "Indonesian",
    nativeLanguage: "Bahasa Indonesia",
    langCode: "id",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "OVO/DANA/GoPay", "Bank Transfer"],
    imageRules: { resize: "1050x1485", template: "id_standard", overlay: "tropical_vibe" },
    currency: { symbol: "Rp", code: "IDR" },
    pricing: {
      packs: [
        { amount: 1, price: "2500", label: "Flexible", save: "" },
        { amount: 10, price: "20000", label: "Starter", save: "20%" },
        { amount: 30, price: "50000", label: "🔥 Most Popular", save: "33%", popular: true },
        { amount: 60, price: "80000", label: "💎 Best Value", save: "47%" }
      ],
      vip: "80000"
    }
  },
  {
    country: "Italy",
    nativeCountry: "Italia",
    language: "Italian",
    nativeLanguage: "Italiano",
    langCode: "it",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1050x1485", template: "eu_a6", overlay: "classic_frame" },
    currency: { symbol: "€", code: "EUR" },
    pricing: {
      packs: [
        { amount: 1, price: "0.15", label: "Flexible", save: "" },
        { amount: 10, price: "1.2", label: "Starter", save: "20%" },
        { amount: 30, price: "2.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "4.9", label: "💎 Best Value", save: "45%" }
      ],
      vip: "4.9"
    }
  },
  {
    country: "Japan",
    nativeCountry: "日本",
    language: "Japanese",
    nativeLanguage: "日本語",
    langCode: "ja",
    login: ["Email+Password", "Google", "LINE/Apple"],
    payment: ["Credit/Debit Card", "PayPay", "Rakuten Pay/au Pay"],
    imageRules: { resize: "1000x1480", template: "jp_standard", overlay: "sakura_watermark" },
    currency: { symbol: "¥", code: "JPY" },
    pricing: {
      packs: [
        { amount: 1, price: "20", label: "Flexible", save: "" },
        { amount: 10, price: "160", label: "Starter", save: "20%" },
        { amount: 30, price: "380", label: "🔥 Most Popular", save: "37%", popular: true },
        { amount: 60, price: "640", label: "💎 Best Value", save: "47%" }
      ],
      vip: "750"
    }
  },
  {
    country: "Malaysia",
    nativeCountry: "Malaysia",
    language: "Malay",
    nativeLanguage: "Bahasa Melayu",
    langCode: "ms",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "Boost/FPX", "PayPal"],
    imageRules: { resize: "1050x1485", template: "my_standard", overlay: "batik_pattern" },
    currency: { symbol: "RM", code: "MYR" },
    pricing: {
      packs: [
        { amount: 1, price: "0.70", label: "Flexible", save: "" },
        { amount: 10, price: "5.5", label: "Starter", save: "21%" },
        { amount: 30, price: "13.5", label: "🔥 Most Popular", save: "36%", popular: true },
        { amount: 60, price: "22.5", label: "💎 Best Value", save: "46%" }
      ],
      vip: "22.5"
    }
  },
  {
    country: "New Zealand",
    nativeCountry: "New Zealand",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1200x1800", template: "au_standard", overlay: "fern_motif" },
    currency: { symbol: "$", code: "NZD" },
    pricing: {
      packs: [
        { amount: 1, price: "0.25", label: "Flexible", save: "" },
        { amount: 10, price: "2.0", label: "Starter", save: "20%" },
        { amount: 30, price: "5.0", label: "🔥 Most Popular", save: "33%", popular: true },
        { amount: 60, price: "8.5", label: "💎 Best Value", save: "43%" }
      ],
      vip: "8.5"
    }
  },
  {
    country: "Philippines",
    nativeCountry: "Pilipinas",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "GCash/PayMaya", "PayPal"],
    imageRules: { resize: "1200x1800", template: "ph_standard", overlay: "sun_rays" },
    currency: { symbol: "₱", code: "PHP" },
    pricing: {
      packs: [
        { amount: 1, price: "8", label: "Flexible", save: "" },
        { amount: 10, price: "65", label: "Starter", save: "19%" },
        { amount: 30, price: "155", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "260", label: "💎 Best Value", save: "46%" }
      ],
      vip: "260"
    }
  },
  {
    country: "Singapore",
    nativeCountry: "Singapore",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayNow/eNETS", "PayPal"],
    imageRules: { resize: "1050x1485", template: "sg_standard", overlay: "orchid_border" },
    currency: { symbol: "$", code: "SGD" },
    pricing: {
      packs: [
        { amount: 1, price: "0.20", label: "Flexible", save: "" },
        { amount: 10, price: "1.6", label: "Starter", save: "20%" },
        { amount: 30, price: "3.8", label: "🔥 Most Popular", save: "37%", popular: true },
        { amount: 60, price: "6.4", label: "💎 Best Value", save: "47%" }
      ],
      vip: "6.4"
    }
  },
  {
    country: "South Korea",
    nativeCountry: "대한민국",
    language: "Korean",
    nativeLanguage: "한국어",
    langCode: "ko",
    login: ["Email+Password", "Google", "Kakao/Facebook"],
    payment: ["Credit/Debit Card", "Kakao Pay/Naver Pay/Toss"],
    imageRules: { resize: "1000x1480", template: "kr_standard", overlay: "modern_minimal" },
    currency: { symbol: "₩", code: "KRW" },
    pricing: {
      packs: [
        { amount: 1, price: "200", label: "Flexible", save: "" },
        { amount: 10, price: "1600", label: "Starter", save: "20%" },
        { amount: 30, price: "3800", label: "🔥 Most Popular", save: "37%", popular: true },
        { amount: 60, price: "6400", label: "💎 Best Value", save: "47%" }
      ],
      vip: "6400"
    }
  },
  {
    country: "Spain",
    nativeCountry: "España",
    language: "Spanish",
    nativeLanguage: "Español",
    langCode: "es",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1050x1485", template: "eu_a6", overlay: "warm_filter" },
    currency: { symbol: "€", code: "EUR" },
    pricing: {
      packs: [
        { amount: 1, price: "0.15", label: "Flexible", save: "" },
        { amount: 10, price: "1.2", label: "Starter", save: "20%" },
        { amount: 30, price: "2.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "4.9", label: "💎 Best Value", save: "45%" }
      ],
      vip: "4.9"
    }
  },
  {
    country: "Thailand",
    nativeCountry: "ประเทศไทย",
    language: "Thai",
    nativeLanguage: "ไทย",
    langCode: "th",
    login: ["Email+Password", "Google", "Facebook/LINE"],
    payment: ["Credit/Debit Card", "TrueMoney/PromptPay", "Bank Transfer"],
    imageRules: { resize: "1050x1485", template: "th_standard", overlay: "gold_accent" },
    currency: { symbol: "฿", code: "THB" },
    pricing: {
      packs: [
        { amount: 1, price: "5", label: "Flexible", save: "" },
        { amount: 10, price: "40", label: "Starter", save: "20%" },
        { amount: 30, price: "95", label: "🔥 Most Popular", save: "37%", popular: true },
        { amount: 60, price: "160", label: "💎 Best Value", save: "47%" }
      ],
      vip: "160"
    }
  },
  {
    country: "UK",
    nativeCountry: "UK",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1050x1485", template: "eu_a6", overlay: "royal_mail_style" },
    currency: { symbol: "£", code: "GBP" },
    pricing: {
      packs: [
        { amount: 1, price: "0.12", label: "Flexible", save: "" },
        { amount: 10, price: "0.95", label: "Starter", save: "21%" },
        { amount: 30, price: "2.3", label: "🔥 Most Popular", save: "36%", popular: true },
        { amount: 60, price: "3.9", label: "💎 Best Value", save: "46%" }
      ],
      vip: "4.5"
    }
  },
  {
    country: "USA",
    nativeCountry: "USA",
    language: "English",
    nativeLanguage: "English",
    langCode: "en",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "PayPal", "Apple Pay/Google Pay"],
    imageRules: { resize: "1200x1800", template: "us_4x6", overlay: "minimal_logo" },
    currency: { symbol: "$", code: "USD" },
    pricing: {
      packs: [
        { amount: 1, price: "0.15", label: "Flexible", save: "" },
        { amount: 10, price: "1.2", label: "Starter", save: "20%" },
        { amount: 30, price: "2.9", label: "🔥 Most Popular", save: "35%", popular: true },
        { amount: 60, price: "4.9", label: "💎 Best Value", save: "45%" }
      ],
      vip: "4.9"
    }
  },
  {
    country: "Vietnam",
    nativeCountry: "Việt Nam",
    language: "Vietnamese",
    nativeLanguage: "Tiếng Việt",
    langCode: "vi",
    login: ["Email+Password", "Google", "Facebook/Apple"],
    payment: ["Credit/Debit Card", "MoMo/ViettelPay", "Bank Transfer"],
    imageRules: { resize: "1050x1485", template: "vn_standard", overlay: "lotus_watermark" },
    currency: { symbol: "₫", code: "VND" },
    pricing: {
      packs: [
        { amount: 1, price: "4000", label: "Flexible", save: "" },
        { amount: 10, price: "32000", label: "Starter", save: "20%" },
        { amount: 30, price: "75000", label: "🔥 Most Popular", save: "37%", popular: true },
        { amount: 60, price: "125000", label: "💎 Best Value", save: "48%" }
      ],
      vip: "125000"
    }
  }
];
