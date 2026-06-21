begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brand_settings'
      and column_name = 'signature_profiles'
  ) then
    alter table public.brand_settings
      add column signature_profiles jsonb not null default
      '{
        "landscape": {"position": "bottom-right", "qrScale": 1, "logoScale": 1},
        "portrait": {"position": "bottom-center", "qrScale": 0.9, "logoScale": 1},
        "square": {"position": "bottom-right", "qrScale": 0.9, "logoScale": 1}
      }'::jsonb;

    update public.brand_settings
    set signature_profiles = jsonb_build_object(
      'landscape', jsonb_build_object('position', watermark_position, 'qrScale', watermark_size, 'logoScale', watermark_size),
      'portrait', jsonb_build_object('position', watermark_position, 'qrScale', watermark_size, 'logoScale', watermark_size),
      'square', jsonb_build_object('position', watermark_position, 'qrScale', watermark_size, 'logoScale', watermark_size)
    );
  end if;
end
$$;

alter table public.brand_settings
  drop constraint if exists brand_settings_signature_profiles_object;

alter table public.brand_settings
  add constraint brand_settings_signature_profiles_object
  check (jsonb_typeof(signature_profiles) = 'object');

commit;
