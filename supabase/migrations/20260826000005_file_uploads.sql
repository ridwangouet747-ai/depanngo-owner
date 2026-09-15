-- Migration: Upload fichiers (CNI, photos de mission)
-- Phase 3, Étape 3.3

-- Table des fichiers uploadés
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('cni_front', 'cni_back', 'profile_photo', 'mission_photo', 'other')),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON file_uploads(file_type);

-- RLS
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_uploads_select_own"
  ON file_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "file_uploads_insert_own"
  ON file_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "file_uploads_delete_own"
  ON file_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Admin peut voir tous les fichiers (pour vérification CNI)
CREATE POLICY "file_uploads_admin_select"
  ON file_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket pour les fichiers users
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Storage RLS policies
CREATE POLICY "storage_user_files_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "storage_user_files_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-files'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
    )
  );

CREATE POLICY "storage_user_files_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ============================================================
-- FONCTION: upload CNI et mettre a jour le statut de verification
-- ============================================================
CREATE OR REPLACE FUNCTION public.upload_cni(
  p_storage_path TEXT,
  p_side TEXT,
  p_original_name TEXT,
  p_mime_type TEXT,
  p_size_bytes BIGINT
)
RETURNS UUID AS $$
DECLARE
  v_file_type TEXT;
  v_upload_id UUID;
BEGIN
  -- Déterminer le type de fichier
  IF p_side = 'front' THEN
    v_file_type := 'cni_front';
  ELSIF p_side = 'back' THEN
    v_file_type := 'cni_back';
  ELSE
    RAISE EXCEPTION 'Invalid CNI side: %', p_side;
  END IF;

  -- Enregistrer le fichier
  INSERT INTO file_uploads (user_id, storage_path, file_type, original_name, mime_type, size_bytes)
  VALUES (auth.uid(), p_storage_path, v_file_type, p_original_name, p_mime_type, p_size_bytes)
  RETURNING id INTO v_upload_id;

  -- Si les deux faces sont uploadées, marquer le repairer comme en attente de vérification
  IF EXISTS (
    SELECT 1 FROM file_uploads
    WHERE user_id = auth.uid() AND file_type IN ('cni_front', 'cni_back')
    GROUP BY user_id
    HAVING COUNT(DISTINCT file_type) = 2
  ) THEN
    UPDATE repairers
    SET id_document_url = p_storage_path,
        updated_at = now()
    WHERE user_id = auth.uid();
  END IF;

  RETURN v_upload_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
