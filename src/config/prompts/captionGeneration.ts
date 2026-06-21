/** The original Cursor-era master prompt, preserved as a cloud-editable template. */
export const captionGenerationPrompt = `You are an expert graphic designer, a master photographer, and a world-class poet. Your task is to analyze this photo to create a breathtaking, elegant postcard.

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
}`;

export const renderCaptionGenerationPrompt = (
  template: string,
  values: {
    copywritingStyle: string;
    styleInstruction: string;
    aiLanguage: string;
    photoMetadata?: string;
  }
) => {
  const replacements: Array<[string, string]> = [
    ['{{copywriting_style}}', values.copywritingStyle],
    ['{{copywriting_style_upper}}', values.copywritingStyle.toUpperCase()],
    ['{{style_instruction}}', values.styleInstruction],
    ['{{ai_language}}', values.aiLanguage],
    ['{{photo_metadata}}', values.photoMetadata ? `${values.photoMetadata.trim()}\n` : ''],
  ];

  return replacements.reduce(
    (rendered, [token, value]) => rendered.split(token).join(value),
    template
  );
};
