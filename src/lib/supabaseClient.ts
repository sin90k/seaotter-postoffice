import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const nativeFetch = globalThis.fetch.bind(globalThis);
let preferSameOriginRelay = false;

const relaySupabaseRequest = async (target: string, input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input.clone() : null;
  const method = String(init?.method || request?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers || request?.headers || undefined);
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : init?.body ?? (request ? await request.arrayBuffer() : undefined);
  return nativeFetch(`/api/supabase-proxy?target=${encodeURIComponent(target)}`, {
    method,
    headers,
    body,
    signal: init?.signal ?? undefined,
  });
};

const resilientSupabaseFetch: typeof fetch = async (input, init) => {
  const target = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  const isFunctionCall = target.includes('/functions/v1/');
  const canUseRelay = /\/(auth|rest|functions)\/v1\//.test((() => { try { return new URL(target).pathname; } catch { return ''; } })());
  const relayInput = input instanceof Request ? input.clone() : input;
  // Edge Functions can run for much longer than auth/data calls. Always try them
  // directly first instead of inheriting a sticky relay preference from login.
  if (preferSameOriginRelay && canUseRelay && !isFunctionCall) {
    return relaySupabaseRequest(target, relayInput, init);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), isFunctionCall ? 100_000 : 6_000);

  try {
    return await nativeFetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (typeof window === 'undefined' || !canUseRelay) throw error;
    preferSameOriginRelay = true;
    console.warn('[Supabase] Direct request failed; retrying through the same-origin relay.', {
      path: (() => { try { return new URL(target).pathname; } catch { return 'unknown'; } })(),
      reason: error instanceof Error ? error.message : 'network_error',
    });

    return relaySupabaseRequest(target, relayInput, init);
  } finally {
    window.clearTimeout(timeout);
  }
};

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
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { fetch: resilientSupabaseFetch },
      })
    : createSafeFallbackClient();
