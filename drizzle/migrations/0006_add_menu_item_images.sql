ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
COMMENT ON COLUMN public.menu_items.image_url IS 'Optional optimized food image data URL managed by restaurant admins.';