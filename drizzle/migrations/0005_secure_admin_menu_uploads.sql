CREATE POLICY "Admins can upload menu files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can read menu files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update menu files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete menu files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-media'
  AND public.has_role(auth.uid(), 'admin')
);