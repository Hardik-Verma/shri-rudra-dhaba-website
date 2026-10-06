ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS banner_video_path text,
  ADD COLUMN IF NOT EXISTS about_heading text NOT NULL DEFAULT 'A highway stop made for a proper pause',
  ADD COLUMN IF NOT EXISTS about_text text NOT NULL DEFAULT 'Shri Rudra Murthal Walo Ka Dhaba welcomes diners on NH-734 near Bijnor. Visit for a dine-in break, browse the live menu, and order from your table.',
  ADD COLUMN IF NOT EXISTS about_image_url text;

CREATE TABLE public.gallery_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT 'Shri Rudra Dhaba',
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_media TO authenticated;
GRANT ALL ON public.gallery_media TO service_role;
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads gallery"
ON public.gallery_media FOR SELECT
TO anon, authenticated
USING (true);
CREATE POLICY "Admins insert gallery"
ON public.gallery_media FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update gallery"
ON public.gallery_media FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete gallery"
ON public.gallery_media FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public reads published site media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'public-media');

CREATE POLICY "Admins upload published site media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'public-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update published site media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'public-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'public-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete published site media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-media' AND (storage.foldername(name))[1] = 'public-media' AND public.has_role(auth.uid(), 'admin'));