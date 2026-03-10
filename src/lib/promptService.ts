/**
 * Prompt management: load priority 1) admin-edited (localStorage), 2) config file fallback.
 */
import { captionGenerationPrompt } from '../config/prompts/captionGeneration';

export type PromptType = 'postcard_layout' | 'caption_generation' | 'translation';

const STORAGE_PREFIX = 'admin_prompt_';

function getStored(promptId: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_PREFIX + promptId);
}

function setStored(promptId: string, content: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + promptId, content);
  localStorage.setItem(STORAGE_PREFIX + promptId + '_modified', String(Date.now()));
}

/** Get caption generation prompt. */
export function getCaptionGenerationPrompt(): string {
  const stored = getStored('caption_generation_default');
  if (stored != null && stored.trim()) return stored.trim();
  return captionGenerationPrompt;
}

const DEFAULT_POSTCARD_LAYOUT = 'Generate a postcard front layout. Use the provided image as the main visual. Add space for optional title and location text. Keep the design elegant and suitable for print.';
const DEFAULT_TRANSLATION = 'Translate the given postcard text naturally into the target language, preserving tone and brevity.';

/** Get any prompt by id (for admin list). Falls back to config default. */
export function getPrompt(promptId: string): string {
  const stored = getStored(promptId);
  if (stored != null && stored.trim()) return stored.trim();
  if (promptId === 'caption_generation_default') return captionGenerationPrompt;
  if (promptId === 'postcard_layout_default') return DEFAULT_POSTCARD_LAYOUT;
  if (promptId === 'translation_default') return DEFAULT_TRANSLATION;
  return '';
}

/** Save admin-edited prompt. */
export function savePrompt(promptId: string, content: string): void {
  setStored(promptId, content);
}

/** Get last modified timestamp for a prompt. */
export function getPromptLastModified(promptId: string): number | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + promptId + '_modified');
    return v ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}

/** List all known prompt IDs for admin. */
export function listPromptIds(): { prompt_id: string; prompt_name: string; prompt_type: PromptType }[] {
  return [
    {
      prompt_id: 'caption_generation_default',
      prompt_name: 'Caption / title generation',
      prompt_type: 'caption_generation',
    },
    {
      prompt_id: 'postcard_layout_default',
      prompt_name: 'Postcard layout',
      prompt_type: 'postcard_layout',
    },
    {
      prompt_id: 'translation_default',
      prompt_name: 'Translation',
      prompt_type: 'translation',
    },
  ];
}
