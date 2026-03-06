import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// 一个始终存在的「安全假客户端」，避免前端因为 Supabase 配置问题直接崩溃
const createSafeFallbackClient = () => {
  const noSession = { data: { session: null }, error: null };
  const noError = { error: null };

  return {
    auth: {
      async getSession() {
        console.warn('[Supabase] 使用 fallback 客户端：getSession');
        return noSession;
      },
      onAuthStateChange(_cb: any) {
        console.warn('[Supabase] 使用 fallback 客户端：onAuthStateChange');
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signUp() {
        console.warn('[Supabase] 使用 fallback 客户端：signUp（不会真正注册）');
        return noError;
      },
      async signInWithPassword() {
        console.warn('[Supabase] 使用 fallback 客户端：signInWithPassword（不会真正登录）');
        return noError;
      },
      async signOut() {
        console.warn('[Supabase] 使用 fallback 客户端：signOut');
        return noError;
      },
    },
  } as any;
};

export const isSupabaseConnected = !!(supabaseUrl && supabaseAnonKey);
if (typeof window !== 'undefined') {
  console.log('[SeaOtter] Supabase:', isSupabaseConnected ? '已连接' : '未连接（环境变量缺失，使用本地模拟）');
}

export const supabase: any =
  isSupabaseConnected
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : createSafeFallbackClient();
