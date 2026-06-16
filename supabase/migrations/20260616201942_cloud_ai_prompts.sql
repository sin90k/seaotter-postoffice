begin;

create table if not exists public.ai_prompts (
  prompt_id text primary key,
  prompt_name text not null,
  prompt_type text not null
    check (prompt_type in ('postcard_layout', 'caption_generation', 'translation', 'back_image')),
  draft_content text,
  published_content text not null,
  published_version integer not null default 1 check (published_version > 0),
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  published_by uuid references auth.users(id)
);

create table if not exists public.ai_prompt_versions (
  id bigserial primary key,
  prompt_id text not null references public.ai_prompts(prompt_id) on delete cascade,
  version integer not null check (version > 0),
  content text not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (prompt_id, version)
);

create table if not exists public.ai_prompt_published (
  prompt_id text primary key,
  prompt_name text not null,
  prompt_type text not null
    check (prompt_type in ('postcard_layout', 'caption_generation', 'translation', 'back_image')),
  content text not null,
  version integer not null check (version > 0),
  published_at timestamptz not null default now()
);

alter table public.ai_prompts enable row level security;
alter table public.ai_prompt_versions enable row level security;
alter table public.ai_prompt_published enable row level security;

drop policy if exists ai_prompts_select_admin on public.ai_prompts;
create policy ai_prompts_select_admin
  on public.ai_prompts for select
  to authenticated
  using (private.is_admin());

drop policy if exists ai_prompts_insert_admin on public.ai_prompts;
create policy ai_prompts_insert_admin
  on public.ai_prompts for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists ai_prompts_update_admin on public.ai_prompts;
create policy ai_prompts_update_admin
  on public.ai_prompts for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists ai_prompt_versions_select_admin on public.ai_prompt_versions;
create policy ai_prompt_versions_select_admin
  on public.ai_prompt_versions for select
  to authenticated
  using (private.is_admin());

drop policy if exists ai_prompt_versions_insert_admin on public.ai_prompt_versions;
create policy ai_prompt_versions_insert_admin
  on public.ai_prompt_versions for insert
  to authenticated
  with check (private.is_admin());

drop policy if exists ai_prompt_published_select_public on public.ai_prompt_published;
create policy ai_prompt_published_select_public
  on public.ai_prompt_published for select
  to anon, authenticated
  using (true);

drop policy if exists ai_prompt_published_write_admin on public.ai_prompt_published;
create policy ai_prompt_published_write_admin
  on public.ai_prompt_published for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select, insert, update on public.ai_prompts to authenticated;
grant select, insert on public.ai_prompt_versions to authenticated;
grant usage, select on sequence public.ai_prompt_versions_id_seq to authenticated;
grant select on public.ai_prompt_published to anon, authenticated;
grant insert, update, delete on public.ai_prompt_published to authenticated;

insert into public.ai_prompts (
  prompt_id,
  prompt_name,
  prompt_type,
  draft_content,
  published_content,
  published_version,
  updated_at,
  published_at
)
values
  (
    'caption_generation_default',
    '标题、地点与正文生成',
    'caption_generation',
    null,
    $prompt$Use EXIF date and GPS as the most reliable source. If GPS or city is missing, infer only recognizable public places from the image. Never use vague private guesses such as 家中, 家里, 室内, 房间, home, or indoors as a map location. Keep the title concise, the back text literary but grounded, and return valid JSON.$prompt$,
    1,
    now(),
    now()
  ),
  (
    'back_image_default',
    '背面 AI 装饰图',
    'back_image',
    null,
    $prompt$Create a subtle postcard-back decorative motif inspired by the photo. Use refined pencil lines, soft pastel accents, airy negative space, and symbolic details. Do not make a literal redraw, do not add readable text, logo, or watermark.$prompt$,
    1,
    now(),
    now()
  ),
  (
    'postcard_layout_default',
    '明信片布局',
    'postcard_layout',
    null,
    $prompt$Generate a postcard front layout. Keep the photo readable, reserve balanced space for title, location, author, and date, and make the result suitable for print.$prompt$,
    1,
    now(),
    now()
  ),
  (
    'translation_default',
    '翻译',
    'translation',
    null,
    $prompt$Translate postcard text naturally into the target language while preserving tone, brevity, and place names.$prompt$,
    1,
    now(),
    now()
  )
on conflict (prompt_id) do nothing;

insert into public.ai_prompt_versions (prompt_id, version, content, note)
select prompt_id, published_version, published_content, 'initial seed'
from public.ai_prompts
on conflict (prompt_id, version) do nothing;

insert into public.ai_prompt_published (prompt_id, prompt_name, prompt_type, content, version, published_at)
select prompt_id, prompt_name, prompt_type, published_content, published_version, published_at
from public.ai_prompts
on conflict (prompt_id) do update
set
  prompt_name = excluded.prompt_name,
  prompt_type = excluded.prompt_type,
  content = excluded.content,
  version = excluded.version,
  published_at = excluded.published_at;

commit;
