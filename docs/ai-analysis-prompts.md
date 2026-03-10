# AI 明信片分析提示词版本对比

用于明信片正面/背面生成的视觉模型分析提示词。代码位置：`src/components/Step5Process.tsx`（约 360–386 行）。

---

## 版本说明

| 版本   | 说明           | 图片参数               |
|--------|----------------|------------------------|
| 旧版本 | 长 prompt，完整说明 | `getCompressedBase64(img)` → 600px, quality 0.6 |
| 新版本 | 精简 prompt，省 token/提速 | `getCompressedBase64(img, 512, 0.65)` |

---

## 旧版本（优化前）

以下为替换前的完整分析提示词（含动态占位符说明）。

### 主提示词

```
You are an expert graphic designer, a master photographer, and a world-class poet. Your task is to analyze this photo to create a breathtaking, elegant postcard.

1. Visual Analysis: Identify the primary subject, the context/location, and the overall mood.
2. Spatial Composition: Find the largest "negative space" for text placement.
3. Literary Creation: Write a title and message that STRICTLY follows the ${settings.copywritingStyle} style.
4. Back Image Prompt: Write a prompt for a complementary pencil sketch.

MANDATORY STYLE: ${currentStyle}
```

### 可选追加（用户故事）

```
USER'S STORY FOR THIS POSTCARD (you MUST use this):
"${settings.cardStory.trim()}"
Design the back layout, message, and tone to reflect this story and its emotion. The title and message should feel connected to both the image and this personal story.
```

### 可选追加（GPS）

```
GPS Coordinates: Latitude ${gpsData.latitude}, Longitude ${gpsData.longitude}. Use these to identify the real location.
```

### 语言与格式要求 + JSON Schema

```
IMPORTANT: All generated text MUST be strictly in ${settings.aiLanguage} language. 
If the target language is Chinese:
- Do NOT include any English characters.
- The 'title' (front) MUST be a short phrase (max 12 chars) in ${settings.copywritingStyle} style.
- The 'message' (back) MUST be a natural observation (max 25 words) in ${settings.copywritingStyle} style, tightly connected to the title.
- AVOID clichés like "愿你...", "在这个喧嚣的世界里". 
- ONLY describe what is ACTUALLY visible in the photo.
- For 'location_name': Use real-world location if possible, otherwise a poetic generic one (e.g., "街角", "海边").
- THE OVERALL TONE MUST BE FORCEFULLY ${settings.copywritingStyle.toUpperCase()}.

Output JSON strictly in this format:
{
  "thought_process": "Brainstorm 3 options in ${settings.copywritingStyle} style, then pick the best one.",
  "subject": "Main subject",
  "context": "Context/location",
  "general_elements": "Key visual elements",
  "location_name": "Specific location name",
  "mood": "Atmosphere",
  "color_palette": ["#hex1", "#hex2"],
  "title": "Title in ${settings.copywritingStyle} style",
  "message": "Message in ${settings.copywritingStyle} style",
  "theme": "One of: 'classic', 'modern', 'vintage', 'handwritten'",
  "postmark": "Short postmark text",
  "artistic_icons": ["icon1", "icon2"],
  "text_position": "One of: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'",
  "back_image_prompt": "Prompt for pencil sketch"
}
```

### 风格说明（currentStyle 来源，未改动）

- `auto`: "Automatically determine the best style based on the image content. If landscape, be poetic. If street/urban, be modern."
- `poetic`: "STYLE: Poetic & Lyrical. Use metaphors, classical imagery, or rhythmic prose. Tone: Elegant, deep, artistic. Example: '山海入怀，万物皆诗' (Mountains and seas in my heart, all things are poetry)."
- `modern`: "STYLE: Modern & Direct. Use contemporary, straightforward language. Tone: Fresh, urban, direct. Example: '在东京街头，遇见一场不期而至的雨' (Meeting an unexpected rain on the streets of Tokyo)."
- `witty`: "STYLE: Witty & Humorous. Use a clever, slightly ironic, or playful tone. Tone: Wry, funny, personal. Example: '这里的猫比人还多，而且它们看起来都比我有钱' (More cats than people here, and they all look richer than me)."
- `nostalgic`: "STYLE: Nostalgic & Sentimental. Use a warm, slightly melancholic tone. Tone: Warm, reflective, timeless. Example: '风里有旧时光的味道，像极了小时候的夏天' (The wind smells like old times, just like the summers of childhood)."
- `minimalist`: "STYLE: Minimalist & Concise. Use extremely short, punchy phrases. 3-5 words max for title. Tone: Zen, essence-focused. Example: '静谧。深蓝。' (Quiet. Deep blue.)."

---

## 新版本（当前使用）

### 主提示词（含可选追加逻辑）

**基础：**

```
Analyze this photo for an elegant postcard. Style: ${currentStyle}
Tasks: (1) Identify subject, location, mood and best text placement. (2) Write a title and back message in ${settings.copywritingStyle} style. (3) Propose a pencil-sketch prompt for the back.
```

**若存在用户故事则追加：**

```
User story (reflect in message/tone): "${settings.cardStory.trim().slice(0, 300)}"
```

**若存在 GPS 则追加：**

```
GPS: ${gpsData.latitude}, ${gpsData.longitude}. Use for location_name if possible.
```

**固定追加（语言 + JSON）：**

```
Language: ${settings.aiLanguage} only. Chinese: no English; title max 12 chars; message max 25 words; avoid "愿你..."; describe only what is visible; location_name real or poetic ("街角","海边").
Output this JSON only:
{"subject":"","context":"","general_elements":"","location_name":"","mood":"","color_palette":["#hex1","#hex2"],"title":"","message":"","theme":"classic|modern|vintage|handwritten","postmark":"","artistic_icons":["icon1","icon2"],"text_position":"top-left|top-right|bottom-left|bottom-right|center","back_image_prompt":""}
```

### 风格说明（currentStyle）

与旧版本相同，仍从 `styleInstructions[settings.copywritingStyle]` 或 `styleInstructions.auto` 取值，代码未改。

---

## 差异小结

| 项目         | 旧版本                         | 新版本                               |
|--------------|--------------------------------|--------------------------------------|
| 角色/任务描述 | 多句 + 4 条编号任务             | 1 句 + 3 条紧凑任务                   |
| 用户故事     | 整段引用                       | 截断至 300 字并单行引用               |
| GPS          | 完整句子                       | 坐标 + 一句说明                      |
| 语言/中文规则 | 多行 bullet                    | 一行概括                             |
| JSON         | 多行带 `thought_process`       | 单行、无 `thought_process`           |
| 图片         | 600px, quality 0.6             | 512px, quality 0.65                  |

解析逻辑与使用的字段（如 `title`, `message`, `location_name`, `theme`, `postmark`, `artistic_icons`, `text_position`, `back_image_prompt`）未改，仅 prompt 与图片尺寸/质量做了上述优化。
