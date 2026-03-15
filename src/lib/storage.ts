import { get, set } from 'idb-keyval';
import { ProcessedPostcard } from '../App';
import { supabase, isSupabaseConnected } from './supabaseClient';

const isTableMissing = (err: { code?: string; message?: string }) =>
  err?.code === 'PGRST205' || (err?.message ?? '').includes('Could not find the table');
const isColumnMissing = (err: { code?: string; message?: string }) =>
  err?.code === '42703' ||
  err?.code === 'PGRST204' ||
  (
    (err?.message ?? '').toLowerCase().includes('column') &&
    (
      (err?.message ?? '').toLowerCase().includes('does not exist') ||
      (err?.message ?? '').toLowerCase().includes('could not find')
    )
  );
const STORAGE_BUCKET = 'postcards';

type SaveOptions = {
  userId?: string | null;
  userLevel?: string;
};

type RetentionConfig = {
  freeDays: number;
  vipDays: number;
};

let retentionCache: { value: RetentionConfig; fetchedAt: number } | null = null;

const dataUrlToBlob = (dataUrl: string): Blob | null => {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1] || 'image/jpeg';
  const b64 = m[2] || '';
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const extFromMime = (mime: string) => {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
};

const isDataUrl = (v?: string) => !!v && /^data:image\//.test(v);

const extractStoragePath = (url: string): string | null => {
  try {
    const u = new URL(url);
    const markerPublic = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const markerSign = `/storage/v1/object/sign/${STORAGE_BUCKET}/`;
    const markerObject = `/storage/v1/object/${STORAGE_BUCKET}/`;
    if (u.pathname.includes(markerPublic)) {
      return decodeURIComponent(u.pathname.split(markerPublic)[1] || '');
    }
    if (u.pathname.includes(markerSign)) {
      return decodeURIComponent(u.pathname.split(markerSign)[1] || '');
    }
    if (u.pathname.includes(markerObject)) {
      return decodeURIComponent(u.pathname.split(markerObject)[1] || '');
    }
    return null;
  } catch {
    return null;
  }
};

const uploadDataUrl = async (dataUrl: string, userId: string, postcardId: string, side: 'front' | 'back'): Promise<string | null> => {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const ext = extFromMime(blob.type);
  const path = `${userId}/${postcardId}/${side}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type || 'image/jpeg',
  });
  if (error) {
    console.error(`[storage] upload ${side} failed:`, error);
    return null;
  }
  return path;
};

const signPath = async (path?: string | null): Promise<string | undefined> => {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!error && data?.signedUrl) return data.signedUrl;
  const pub = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return pub?.data?.publicUrl || undefined;
};

const getRetentionConfig = async (): Promise<RetentionConfig> => {
  const now = Date.now();
  if (retentionCache && now - retentionCache.fetchedAt < 5 * 60 * 1000) {
    return retentionCache.value;
  }
  const fallback: RetentionConfig = { freeDays: 7, vipDays: 0 };
  if (!isSupabaseConnected) return fallback;
  const { data, error } = await supabase
    .from('payment_config')
    .select('free_retention_days, vip_retention_days')
    .eq('id', 1)
    .single();
  if (error || !data) return fallback;
  const freeDays = typeof data.free_retention_days === 'number' && data.free_retention_days > 0 ? data.free_retention_days : 7;
  const vipDays = typeof data.vip_retention_days === 'number' && data.vip_retention_days >= 0 ? data.vip_retention_days : 0;
  const value = { freeDays, vipDays };
  retentionCache = { value, fetchedAt: now };
  return value;
};

const computeExpiresAt = async (createdAtMs: number, userLevel?: string): Promise<string | null> => {
  const cfg = await getRetentionConfig();
  const createdAt = Number.isFinite(createdAtMs) && createdAtMs > 0 ? createdAtMs : Date.now();
  if (userLevel === 'vip') {
    if (cfg.vipDays === 0) return null;
    return new Date(createdAt + cfg.vipDays * 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(createdAt + cfg.freeDays * 24 * 60 * 60 * 1000).toISOString();
};

/**
 * 登录用户：优先从 Supabase postcards 表读取历史；
 * 游客或 Supabase 未连接：使用浏览器本地 IndexedDB。
 */
export const loadHistory = async (userId?: string | null): Promise<ProcessedPostcard[]> => {
  if (userId && isSupabaseConnected) {
    const advanced = await supabase
      .from('postcards')
      .select('id, created_at, payload, front_path, back_path, expires_at, deleted_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!advanced.error && advanced.data) {
      const now = Date.now();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      const inferredLevel = profile?.role === 'vip' ? 'vip' : 'free';
      const mapped = await Promise.all((advanced.data || []).map(async (r: any) => {
        const payload = (r.payload || {}) as ProcessedPostcard;
        if (r.deleted_at) return null;
        const exp = r.expires_at ? new Date(r.expires_at).getTime() : null;
        if (exp !== null && Number.isFinite(exp) && exp <= now) return null;

        let frontPath: string | null = r.front_path || payload.front_path || null;
        let backPath: string | null = r.back_path || payload.back_path || null;
        let expiresAt: string | null = r.expires_at ?? payload.expires_at ?? null;
        let changed = false;

        // 懒迁移：老数据只有 payload(base64) 时，在读取时自动回填到 Storage
        if (!frontPath && payload.frontDataUrl && isDataUrl(payload.frontDataUrl)) {
          const uploaded = await uploadDataUrl(payload.frontDataUrl, userId, payload.id || String(r.id), 'front');
          if (uploaded) {
            frontPath = uploaded;
            changed = true;
          }
        }
        if (!backPath && payload.backDataUrl && isDataUrl(payload.backDataUrl)) {
          const uploaded = await uploadDataUrl(payload.backDataUrl, userId, payload.id || String(r.id), 'back');
          if (uploaded) {
            backPath = uploaded;
            changed = true;
          }
        }
        if (!expiresAt) {
          const createdMs = r.created_at ? new Date(r.created_at).getTime() : (payload.createdAt || payload.timestamp || Date.now());
          expiresAt = await computeExpiresAt(createdMs, inferredLevel);
          changed = true;
        }
        if (changed) {
          await supabase
            .from('postcards')
            .update({
              front_path: frontPath,
              back_path: backPath,
              expires_at: expiresAt,
            })
            .eq('id', r.id);
        }

        const frontSigned = await signPath(frontPath);
        const backSigned = await signPath(backPath);
        return {
          ...payload,
          front_path: frontPath || undefined,
          back_path: backPath || undefined,
          expires_at: expiresAt,
          deleted_at: r.deleted_at ?? payload.deleted_at ?? null,
          frontUrl: frontSigned || payload.frontUrl || payload.frontDataUrl || '',
          backUrl: backSigned || payload.backUrl || payload.backDataUrl || '',
        } as ProcessedPostcard;
      }));
      const cloudRows = mapped.filter(Boolean) as ProcessedPostcard[];
      if (cloudRows.length > 0) return cloudRows;
      // 云端空但本地有缓存时，优先返回本地，随后由 saveHistory 自动回填云端（无感恢复）
      const localFallback = ((await get('postcard_history')) as ProcessedPostcard[] | undefined) || [];
      if (localFallback.length > 0) return localFallback;
      return cloudRows;
    }

    if (advanced.error) {
      if (isTableMissing(advanced.error)) {
        // 表不存在时返回空数组，但不再永久跳过；建表后下次会自动生效
        return [];
      }
      // 迁移未执行时兼容旧 schema（只读 payload）
      if (isColumnMissing(advanced.error)) {
        const legacy = await supabase
          .from('postcards')
          .select('payload')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!legacy.error && legacy.data) {
          return (legacy.data || []).map((r: { payload: ProcessedPostcard }) => r.payload);
        }
      }
      console.error('[storage] loadHistory Supabase error:', advanced.error);
      return ((await get('postcard_history')) as ProcessedPostcard[] | undefined) || [];
    }
  }
  return ((await get('postcard_history')) as ProcessedPostcard[] | undefined) || [];
};

/**
 * 同步历史到 Supabase：
 * - 登录用户：postcards 表作为权威数据源，本地 IndexedDB 仅作缓存；
 * - 游客：只写 IndexedDB。
 */
export const saveHistory = async (history: ProcessedPostcard[], options?: SaveOptions | string | null): Promise<void> => {
  const userId = typeof options === 'string' || options == null ? options : options.userId;
  const userLevel = typeof options === 'object' && options ? options.userLevel : undefined;
  if (userId && isSupabaseConnected) {
    const normalized: ProcessedPostcard[] = [];
    for (const p of history) {
      const next = { ...p };
      const frontSource = next.frontDataUrl || next.frontUrl;
      const backSource = next.backDataUrl || next.backUrl;
      if (!next.front_path) {
        if (frontSource && isDataUrl(frontSource)) {
          const uploaded = await uploadDataUrl(frontSource, userId, next.id, 'front');
          if (uploaded) next.front_path = uploaded;
        } else if (frontSource && /^https?:\/\//.test(frontSource)) {
          next.front_path = extractStoragePath(frontSource) ?? undefined;
        }
      }
      if (!next.back_path && backSource) {
        if (isDataUrl(backSource)) {
          const uploaded = await uploadDataUrl(backSource, userId, next.id, 'back');
          if (uploaded) next.back_path = uploaded;
        } else if (/^https?:\/\//.test(backSource)) {
          next.back_path = extractStoragePath(backSource) ?? undefined;
        }
      }
      next.expires_at = await computeExpiresAt(next.createdAt || next.timestamp, userLevel);
      normalized.push(next);
    }

    const { error: delErr } = await supabase.from('postcards').delete().eq('user_id', userId);
    if (delErr && !isTableMissing(delErr)) {
      console.error('[storage] saveHistory delete error:', delErr);
    }
    if (normalized.length > 0) {
      const rows = normalized.map((p) => ({
        user_id: userId,
        payload: p,
        front_path: p.front_path ?? null,
        back_path: p.back_path ?? null,
        expires_at: p.expires_at ?? null,
        deleted_at: null,
      }));
      const advancedInsert = await supabase.from('postcards').insert(rows).select('id, payload');
      if (advancedInsert.error && !isTableMissing(advancedInsert.error)) {
        if (isColumnMissing(advancedInsert.error)) {
          // 旧 schema 兼容：仅写 payload
          const legacyRows = normalized.map((p) => ({ user_id: userId, payload: p }));
          const legacyInsert = await supabase.from('postcards').insert(legacyRows);
          if (legacyInsert.error && !isTableMissing(legacyInsert.error)) {
            console.error('[storage] saveHistory legacy insert error:', legacyInsert.error);
          }
        } else {
          console.error('[storage] saveHistory insert error:', advancedInsert.error);
        }
      } else if (Array.isArray(advancedInsert.data)) {
        const metadataRows = advancedInsert.data
          .map((r: { id?: string; payload?: ProcessedPostcard }) => {
            const payload = (r.payload || {}) as ProcessedPostcard;
            return {
              postcard_id: r.id,
              user_id: userId,
              postcard_local_id: payload.id || null,
              city: payload.city || null,
              country: payload.country || null,
              latitude: typeof payload.latitude === 'number' ? payload.latitude : null,
              longitude: typeof payload.longitude === 'number' ? payload.longitude : null,
              theme_slug: payload.theme_slug || null,
              source: 'exif_or_ai',
              updated_at: new Date().toISOString(),
            };
          })
          .filter((row: { postcard_id?: string | null }) => !!row.postcard_id);
        if (metadataRows.length > 0) {
          const upMeta = await supabase
            .from('postcard_metadata')
            .upsert(metadataRows, { onConflict: 'postcard_id' });
          if (upMeta.error && !isTableMissing(upMeta.error)) {
            console.error('[storage] saveHistory postcard_metadata upsert error:', upMeta.error);
          }
        }
      }
    }
    await set('postcard_history', normalized);
    return;
  }
  await set('postcard_history', history);
};
