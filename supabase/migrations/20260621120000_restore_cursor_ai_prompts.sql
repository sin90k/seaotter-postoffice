begin;

update public.ai_prompts
set
  prompt_name = 'Cursor 原版照片分析主提示词',
  published_content = $prompt$You are an expert graphic designer, a master photographer, and a world-class poet. Your task is to analyze this photo to create a breathtaking, elegant postcard.

1. Visual Analysis: Identify the primary subject, the context/location, and the overall mood.
2. Spatial Composition: Find the largest "negative space" for text placement.
3. Literary Creation: Write a title and message that STRICTLY follows the {{copywriting_style}} style.
4. Back Image Prompt: Write a prompt for a complementary pencil sketch.

MANDATORY STYLE: {{style_instruction}}
{{photo_metadata}}
IMPORTANT: All generated text MUST be strictly in {{ai_language}} language.
If the target language is Chinese:
- Do NOT include any English characters.
- The 'title' (front) MUST be a short phrase (max 12 chars) in {{copywriting_style}} style.
- The 'message' (back) MUST be a natural observation (max 25 words) in {{copywriting_style}} style, tightly connected to the title.
- AVOID clichés like "愿你...", "在这个喧嚣的世界里".
- ONLY describe what is ACTUALLY visible in the photo.
- For 'location_name': Use real-world location if possible, otherwise a poetic generic one (e.g., "街角", "海边").
- THE OVERALL TONE MUST BE FORCEFULLY {{copywriting_style_upper}}.

Output JSON strictly in this format:
{
  "thought_process": "Brainstorm 3 options in {{copywriting_style}} style, then pick the best one.",
  "subject": "Main subject",
  "context": "Context/location",
  "general_elements": "Key visual elements",
  "location_name": "Specific location name",
  "mood": "Atmosphere",
  "color_palette": ["#hex1", "#hex2"],
  "title": "Title in {{copywriting_style}} style",
  "message": "Message in {{copywriting_style}} style",
  "theme": "One of: 'classic', 'modern', 'vintage', 'handwritten'",
  "postmark": "Short postmark text",
  "artistic_icons": ["icon1", "icon2"],
  "text_position": "One of: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'",
  "back_image_prompt": "Prompt for pencil sketch"
}$prompt$,
  draft_content = null,
  published_version = 2,
  updated_at = now(),
  published_at = now()
where prompt_id = 'caption_generation_default';

insert into public.ai_prompt_versions (prompt_id, version, content, note)
select prompt_id, 2, published_content, 'restore exact Cursor-era master prompt from git a736a33'
from public.ai_prompts
where prompt_id = 'caption_generation_default'
on conflict (prompt_id, version) do update
set content = excluded.content, note = excluded.note;

update public.ai_prompt_published
set
  prompt_name = 'Cursor 原版照片分析主提示词',
  content = (select published_content from public.ai_prompts where prompt_id = 'caption_generation_default'),
  version = 2,
  published_at = now()
where prompt_id = 'caption_generation_default';

update public.ai_prompts
set
  prompt_name = '背面 AI 备用绘图提示词',
  published_content = 'A finely detailed pencil sketch with soft pastel colors, delicate lines, white background, high quality, artistic, elegant, subtle shading, watermark style.',
  draft_content = null,
  published_version = 2,
  updated_at = now(),
  published_at = now()
where prompt_id = 'back_image_default';

insert into public.ai_prompt_versions (prompt_id, version, content, note)
select prompt_id, 2, published_content, 'restore original Cursor-era fallback style from git a736a33'
from public.ai_prompts
where prompt_id = 'back_image_default'
on conflict (prompt_id, version) do update
set content = excluded.content, note = excluded.note;

update public.ai_prompt_published
set
  prompt_name = '背面 AI 备用绘图提示词',
  content = (select published_content from public.ai_prompts where prompt_id = 'back_image_default'),
  version = 2,
  published_at = now()
where prompt_id = 'back_image_default';

commit;
