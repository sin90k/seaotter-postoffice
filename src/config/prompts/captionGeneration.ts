/** Default prompt for caption/title generation. Admin overrides via promptService. */
export const captionGenerationPrompt =
  "Analyze this photo for an elegant postcard. Tasks: (1) Identify subject, location, mood and best text placement. (2) Write a short title and back message. (3) Propose a pencil-sketch prompt for the back. Output JSON only with keys: subject, context, location_name, mood, title, message, theme, postmark, artistic_icons, text_position, back_image_prompt.";
