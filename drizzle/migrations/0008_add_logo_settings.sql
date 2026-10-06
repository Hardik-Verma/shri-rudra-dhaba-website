ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS logo_image_url text;
COMMENT ON COLUMN public.site_settings.logo_image_url IS 'Optional restaurant logo managed by admins. Shown in the site header; falls back to the monogram when empty.';
