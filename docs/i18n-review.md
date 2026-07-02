# Internationalization Review

## Supported locales

The product has one canonical locale list: `en`, `zh`, `ja`, `ko`, `fr`, `de`, `es`, `it`, `th`, `vi`, `id`, and `ms`.

Country controls pricing, payment, currency, and image rules. Locale controls interface copy, generated card labels, typography, and the default AI output language. Components must not infer locale from country names or use `zh / everything else` branches.

## Fallback rules

1. Normalize region variants such as `en-US` to the supported base locale.
2. Use the selected locale when a translation exists.
3. Fall back to English for a missing key, never to a mix of English and Chinese.
4. User-entered content is never translated automatically.
5. Card labels and exported images use the selected interface locale unless the user explicitly selects another output language.

## Terminology

| Concept | Simplified Chinese | English | Japanese | Korean |
| --- | --- | --- | --- | --- |
| Postcard | 明信片 | Postcard | ポストカード | 엽서 |
| Polaroid | 拍立得 | Polaroid | ポラロイド | 폴라로이드 |
| Ticket | 票根 | Ticket | チケット | 티켓 |
| Dive log | 潜水日志 | Dive Log | ダイビングログ | 다이빙 로그 |
| Front | 正面 | Front | 表面 | 앞면 |
| Back | 背面 | Back | 裏面 | 뒷면 |
| Credits | 积分 | Credits | クレジット | 크레딧 |
| Brand | 品牌 | Brand | ブランド | 브랜드 |

Use natural product language rather than literal translation. Keep button labels as commands and section labels as nouns.

## Typography

- CJK: no letter spacing, strict line breaking, avoid forced uppercase.
- Thai: increased line height and a Thai-capable fallback font.
- Latin: preserve normal casing for user titles; uppercase is reserved for decorative micro-labels.
- Buttons must allow wrapping when translated labels exceed one line.

## Remaining migration rule

New UI copy must be added to the central i18n layer. Existing component dictionaries can be migrated incrementally, but new `language === 'zh' ? ... : ...` branches are not allowed.
