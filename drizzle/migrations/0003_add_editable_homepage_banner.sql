ALTER TABLE public.site_settings
  ADD COLUMN banner_image_url text,
  ADD COLUMN banner_eyebrow text NOT NULL DEFAULT 'Shri Rudra',
  ADD COLUMN banner_heading text NOT NULL DEFAULT 'Murthal Walo Ka Dhaba',
  ADD COLUMN banner_text text NOT NULL DEFAULT 'Authentic Murthal-style flavours on NH-734. Fresh tandoor, white-butter parathas and kulhad chai — right on the highway.',
  ADD COLUMN banner_primary_button text NOT NULL DEFAULT 'Navigate',
  ADD COLUMN banner_secondary_button text NOT NULL DEFAULT 'Call Dhaba';