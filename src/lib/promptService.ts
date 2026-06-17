/**
 * Prompt management:
 * 1) published Supabase prompts for runtime, 2) admin drafts/version history in Supabase,
 * 3) local/default fallback when Supabase is unavailable.
 */
import { captionGenerationPrompt } from '../config/prompts/captionGeneration';
import { supabase } from './supabaseClient';

export type PromptType = 'postcard_layout' | 'caption_generation' | 'translation' | 'back_image';

export type PromptSummary = {
  prompt_id: string;
  prompt_name: string;
  prompt_type: PromptType;
};

export type PromptRecord = PromptSummary & {
  draft_content: string | null;
  published_content: string;
  published_version: number;
  updated_at: string | null;
  published_at: string | null;
};

export type PromptVersion = {
  id?: number;
  prompt_id: string;
  version: number;
  content: string;
  note?: string | null;
  created_at?: string | null;
};

const STORAGE_PREFIX = 'admin_prompt_';
const RUNTIME_CACHE_PREFIX = 'published_prompt_';

const DEFAULT_BACK_IMAGE =
  `Write a prompt for a complementary pencil sketch for the back of an elegant postcard.
The sketch should match the same place, subject, mood, color palette, and poetic tone identified from the photo.
It should feel like a quiet printed postcard ornament: refined pencil lines, soft pastel accents, delicate paper texture, symbolic travel details, and generous negative space.
The main motif must be visible at postcard preview size, with gentle but readable contrast rather than disappearing into the paper.
Avoid literal photo redraws, photorealistic backgrounds, full-bleed scenes, readable text, logos, QR codes, and watermarks.`;
const DEFAULT_POSTCARD_LAYOUT =
  'Generate a postcard front layout. Keep the photo readable, reserve balanced space for title, location, author, and date, and make the result suitable for print.';
const DEFAULT_TRANSLATION =
  'Translate postcard text naturally into the target language while preserving tone, brevity, and place names.';

const DEFAULT_PROMPTS: PromptRecord[] = [
  {
    prompt_id: 'caption_generation_default',
    prompt_name: '标题、地点与正文生成',
    prompt_type: 'caption_generation',
    draft_content: null,
    published_content: captionGenerationPrompt,
    published_version: 1,
    updated_at: null,
    published_at: null,
  },
  {
    prompt_id: 'back_image_default',
    prompt_name: '背面 AI 装饰图',
    prompt_type: 'back_image',
    draft_content: null,
    published_content: DEFAULT_BACK_IMAGE,
    published_version: 1,
    updated_at: null,
    published_at: null,
  },
  {
    prompt_id: 'postcard_layout_default',
    prompt_name: '明信片布局',
    prompt_type: 'postcard_layout',
    draft_content: null,
    published_content: DEFAULT_POSTCARD_LAYOUT,
    published_version: 1,
    updated_at: null,
    published_at: null,
  },
  {
    prompt_id: 'translation_default',
    prompt_name: '翻译',
    prompt_type: 'translation',
    draft_content: null,
    published_content: DEFAULT_TRANSLATION,
    published_version: 1,
    updated_at: null,
    published_at: null,
  },
];

function readLocal(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Local storage is a convenience cache only.
  }
}

function getDefault(promptId: string): PromptRecord | undefined {
  return DEFAULT_PROMPTS.find((prompt) => prompt.prompt_id === promptId);
}

function getLocalDraft(promptId: string): string | null {
  return readLocal(STORAGE_PREFIX + promptId);
}

function setLocalDraft(promptId: string, content: string): void {
  writeLocal(STORAGE_PREFIX + promptId, content);
  writeLocal(STORAGE_PREFIX + promptId + '_modified', String(Date.now()));
}

function setRuntimeCache(promptId: string, content: string): void {
  writeLocal(RUNTIME_CACHE_PREFIX + promptId, content);
}

function getRuntimeCache(promptId: string): string | null {
  return readLocal(RUNTIME_CACHE_PREFIX + promptId);
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    if (typeof supabase?.auth?.getUser !== 'function') return null;
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

/** Get caption generation prompt synchronously for legacy callers. */
export function getCaptionGenerationPrompt(): string {
  const cached = getRuntimeCache('caption_generation_default');
  if (cached?.trim()) return cached.trim();
  const draft = getLocalDraft('caption_generation_default');
  if (draft?.trim()) return draft.trim();
  return captionGenerationPrompt;
}

/** Runtime: read the public published prompt. Falls back safely. */
export async function getPublishedPromptContent(promptId: string): Promise<string> {
  const fallback = getDefault(promptId)?.published_content || getLocalDraft(promptId) || '';
  try {
    const { data, error } = await supabase
      .from('ai_prompt_published')
      .select('content')
      .eq('prompt_id', promptId)
      .maybeSingle();
    if (error) throw error;
    const content = String(data?.content || '').trim();
    if (content) {
      setRuntimeCache(promptId, content);
      return content;
    }
  } catch {
    const cached = getRuntimeCache(promptId);
    if (cached?.trim()) return cached.trim();
  }
  return fallback;
}

/** Admin: list prompts with drafts and published versions. */
export async function loadPromptRecords(): Promise<PromptRecord[]> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('prompt_id,prompt_name,prompt_type,draft_content,published_content,published_version,updated_at,published_at')
      .order('prompt_type', { ascending: true })
      .order('prompt_id', { ascending: true });
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) return data as PromptRecord[];
  } catch {
    // Admin page will show the fallback list and can still edit locally until Supabase is ready.
  }
  return DEFAULT_PROMPTS.map((prompt) => ({
    ...prompt,
    draft_content: getLocalDraft(prompt.prompt_id) || prompt.draft_content,
  }));
}

export async function loadPromptVersions(promptId: string): Promise<PromptVersion[]> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_versions')
      .select('id,prompt_id,version,content,note,created_at')
      .eq('prompt_id', promptId)
      .order('version', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []) as PromptVersion[];
  } catch {
    const fallback = getDefault(promptId);
    return fallback
      ? [{ prompt_id: promptId, version: fallback.published_version, content: fallback.published_content, note: 'local fallback' }]
      : [];
  }
}

export async function savePromptDraft(promptId: string, content: string): Promise<void> {
  setLocalDraft(promptId, content);
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('ai_prompts')
    .update({
      draft_content: content,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('prompt_id', promptId);
  if (error) throw error;
}

export async function publishPrompt(prompt: PromptRecord, content: string): Promise<PromptRecord> {
  const nextVersion = (prompt.published_version || 0) + 1;
  const now = new Date().toISOString();
  const userId = await getCurrentUserId();

  const { error: updateError } = await supabase
    .from('ai_prompts')
    .update({
      draft_content: content,
      published_content: content,
      published_version: nextVersion,
      updated_at: now,
      published_at: now,
      updated_by: userId,
      published_by: userId,
    })
    .eq('prompt_id', prompt.prompt_id);
  if (updateError) throw updateError;

  const { error: versionError } = await supabase
    .from('ai_prompt_versions')
    .insert({
      prompt_id: prompt.prompt_id,
      version: nextVersion,
      content,
      note: 'published from admin',
      created_by: userId,
    });
  if (versionError) throw versionError;

  const { error: publicError } = await supabase
    .from('ai_prompt_published')
    .upsert({
      prompt_id: prompt.prompt_id,
      prompt_name: prompt.prompt_name,
      prompt_type: prompt.prompt_type,
      content,
      version: nextVersion,
      published_at: now,
    });
  if (publicError) throw publicError;

  setRuntimeCache(prompt.prompt_id, content);
  setLocalDraft(prompt.prompt_id, content);
  return {
    ...prompt,
    draft_content: content,
    published_content: content,
    published_version: nextVersion,
    updated_at: now,
    published_at: now,
  };
}

export async function rollbackPrompt(prompt: PromptRecord, target: PromptVersion): Promise<PromptRecord> {
  const nextVersion = (prompt.published_version || 0) + 1;
  const now = new Date().toISOString();
  const userId = await getCurrentUserId();

  const { error: updateError } = await supabase
    .from('ai_prompts')
    .update({
      draft_content: target.content,
      published_content: target.content,
      published_version: nextVersion,
      updated_at: now,
      published_at: now,
      updated_by: userId,
      published_by: userId,
    })
    .eq('prompt_id', prompt.prompt_id);
  if (updateError) throw updateError;

  const { error: versionError } = await supabase
    .from('ai_prompt_versions')
    .insert({
      prompt_id: prompt.prompt_id,
      version: nextVersion,
      content: target.content,
      note: `rollback to v${target.version}`,
      created_by: userId,
    });
  if (versionError) throw versionError;

  const { error: publicError } = await supabase
    .from('ai_prompt_published')
    .upsert({
      prompt_id: prompt.prompt_id,
      prompt_name: prompt.prompt_name,
      prompt_type: prompt.prompt_type,
      content: target.content,
      version: nextVersion,
      published_at: now,
    });
  if (publicError) throw publicError;

  setRuntimeCache(prompt.prompt_id, target.content);
  setLocalDraft(prompt.prompt_id, target.content);
  return {
    ...prompt,
    draft_content: target.content,
    published_content: target.content,
    published_version: nextVersion,
    updated_at: now,
    published_at: now,
  };
}

/** Legacy admin helpers retained for older imports. */
export function getPrompt(promptId: string): string {
  const draft = getLocalDraft(promptId);
  if (draft?.trim()) return draft.trim();
  return getDefault(promptId)?.published_content || '';
}

export function savePrompt(promptId: string, content: string): void {
  setLocalDraft(promptId, content);
}

export function getPromptLastModified(promptId: string): number | null {
  const v = readLocal(STORAGE_PREFIX + promptId + '_modified');
  return v ? parseInt(v, 10) : null;
}

export function listPromptIds(): PromptSummary[] {
  return DEFAULT_PROMPTS.map(({ prompt_id, prompt_name, prompt_type }) => ({ prompt_id, prompt_name, prompt_type }));
}
