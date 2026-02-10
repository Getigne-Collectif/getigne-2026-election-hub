-- Bucket pour les images configurables du site
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');

-- Upload/auth pour les admins
CREATE POLICY "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "Authenticated users can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "Authenticated users can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');
