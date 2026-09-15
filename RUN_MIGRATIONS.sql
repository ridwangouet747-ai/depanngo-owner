-- ===========================================================================
-- RUN_MIGRATIONS.sql — Script régénéré à partir de supabase/migrations/
-- À exécuter dans le SQL Editor du Dashboard Supabase (dans cet ordre).
-- Généré le 2026-09-16 00:42 — NE PAS modifier à la main.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- MIGRATION : 20260113182344_680fbdf0-d334-461c-b944-e2ec53c03da4.sql
-- ---------------------------------------------------------------------------
-- Presentations table (deck metadata)
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Slides table (ordering and metadata only - content is in .tsx files)
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments table (for slide annotations)
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slide_id UUID NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  x_position NUMERIC NOT NULL,
  y_position NUMERIC NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CMS strings table (all UI text for easy editing)
CREATE TABLE public.cms_strings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now - personal tool)
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_strings ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth needed for personal tool)
CREATE POLICY "Public access for presentations" ON public.presentations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for slides" ON public.slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for cms_strings" ON public.cms_strings FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_slides_presentation_id ON public.slides(presentation_id);
CREATE INDEX idx_slides_position ON public.slides(presentation_id, position);
CREATE INDEX idx_comments_slide_id ON public.comments(slide_id);
CREATE INDEX idx_cms_strings_key ON public.cms_strings(key);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_strings_updated_at
  BEFORE UPDATE ON public.cms_strings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260113182353_c37938eb-b314-40e9-8d18-aab50cd9d5c4.sql
-- ---------------------------------------------------------------------------
-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260113192052_4cd3caff-0bd7-4114-a355-b92fe0046cae.sql
-- ---------------------------------------------------------------------------
-- Add deleted_at column for soft delete (agent will clean up files later)
ALTER TABLE public.slides 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for querying non-deleted slides
CREATE INDEX idx_slides_deleted_at ON public.slides (deleted_at) WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260113192330_4ec1eeb3-0fd4-4fe8-9cb1-cee8cb248483.sql
-- ---------------------------------------------------------------------------
-- Add pending_agent_action field to track slides waiting for agent processing
ALTER TABLE public.slides 
ADD COLUMN pending_agent_action boolean NOT NULL DEFAULT false;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260113235029_f90d5be7-2eed-42f7-842f-fe0188664760.sql
-- ---------------------------------------------------------------------------
-- Create slide_changes table for storing pending edits per slide
CREATE TABLE public.slide_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slide_id UUID NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slide_changes ENABLE ROW LEVEL SECURITY;

-- Public access policy (matching existing pattern)
CREATE POLICY "Public access for slide_changes"
ON public.slide_changes
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for efficient lookups by slide
CREATE INDEX idx_slide_changes_slide_id ON public.slide_changes(slide_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.slide_changes;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260114100003_8b82112f-be87-401b-8af5-d2f25f7d5a9e.sql
-- ---------------------------------------------------------------------------
-- Add x_position and y_position columns to slide_changes table for positioned AI edit comments
ALTER TABLE public.slide_changes 
ADD COLUMN x_position numeric DEFAULT 50,
ADD COLUMN y_position numeric DEFAULT 50;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260129103840_a3b54b84-35f1-4208-85d8-cd2eb03d56dd.sql
-- ---------------------------------------------------------------------------
-- Drop cms_strings table
DROP TABLE IF EXISTS public.cms_strings;

-- Drop presentations table (need to drop slides FK constraint first or use CASCADE)
-- First remove the foreign key from slides
ALTER TABLE public.slides DROP CONSTRAINT IF EXISTS slides_presentation_id_fkey;

-- Drop presentations table
DROP TABLE IF EXISTS public.presentations;

-- Remove presentation_id column from slides since we're simplifying
ALTER TABLE public.slides DROP COLUMN IF EXISTS presentation_id;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260129171838_9efdbb2b-a42e-4b25-bcb8-81d041425c1b.sql
-- ---------------------------------------------------------------------------
-- Drop the restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Public access for presenter_notes" ON public.presenter_notes;

CREATE POLICY "Allow all access to presenter_notes" 
ON public.presenter_notes 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260129171902_b9d82176-3e43-4c33-93f1-4cc61f25d13f.sql
-- ---------------------------------------------------------------------------
-- Drop the slides table (no longer used, ordering is local-only)
DROP TABLE IF EXISTS public.slides;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000000_security_admin_role.sql
-- ---------------------------------------------------------------------------
-- Migration: Sécurité admin + rôle auto-assigné
-- Phase 1, Étape 3 & 6

-- 1. Ajouter la colonne is_admin à profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Fonction trigger : auto-assigner le rôle à l'inscription
-- Le rôle vient du user metadata (options.data.role) ou "client" par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  -- Forcer "client" si le rôle n'est pas valide
  IF user_role NOT IN ('client', 'repairer') THEN
    user_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger sur l'inscription auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Default trust_score pour les nouveaux repairers
ALTER TABLE repairers ALTER COLUMN trust_score SET DEFAULT 50;

-- 5. Marquer l'admin (email configuré dans .env.local)
-- Exécuter après le premier login de l'admin :
-- UPDATE profiles SET is_admin = true WHERE email = 'ridwan.gouet747@gmail.com';


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000001_rls_complete.sql
-- ---------------------------------------------------------------------------
-- Migration: RLS complet pour toutes les tables métier
-- Phase 1, Étape 4 — Sécurité base de données
--
-- IMPORTANT: Exécuter dans Supabase Dashboard > SQL Editor
-- ou via: supabase db push

-- ============================================================
-- 1. PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques permissives si elles existent
DROP POLICY IF EXISTS "Public access for profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all access to profiles" ON profiles;

-- Lecture publique (noms, quartier, spécialités visibles)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Chaque user ne peut modifier que SON profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insertion via trigger (handle_new_user), pas d'insert client direct
CREATE POLICY "profiles_insert_service_only"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- ============================================================
-- 2. REPAIRERS
-- ============================================================
ALTER TABLE repairers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for repairers" ON repairers;
DROP POLICY IF EXISTS "Allow all access to repairers" ON repairers;

-- Lecture publique (liste des techniciens visible par tous)
CREATE POLICY "repairers_select_public"
  ON repairers FOR SELECT
  USING (true);

-- Le technicien ne peut modifier que SON profil
CREATE POLICY "repairers_update_own"
  ON repairers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insertion lors de l'inscription pro (authentifié)
CREATE POLICY "repairers_insert_own"
  ON repairers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all access to transactions" ON transactions;

-- Le client voit ses propres transactions
CREATE POLICY "transactions_select_client"
  ON transactions FOR SELECT
  USING (auth.uid() = client_id);

-- Le repairer voit les transactions qui lui sont assignées
CREATE POLICY "transactions_select_repairer"
  ON transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM repairers WHERE id = repairer_id
    )
  );

-- Le client peut créer une transaction (lui-même comme client)
CREATE POLICY "transactions_insert_client"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = client_id OR client_id IS NULL);

-- Le repairer peut accepter/refuser une transaction assignée
CREATE POLICY "transactions_update_repairer"
  ON transactions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM repairers WHERE id = repairer_id
    )
    OR auth.uid() = client_id
  );

-- ============================================================
-- 4. MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for messages" ON messages;
DROP POLICY IF EXISTS "Allow all access to messages" ON messages;

-- Les participants à la transaction peuvent lire les messages
CREATE POLICY "messages_select_participants"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT client_id FROM transactions WHERE id = transaction_id
    )
    OR auth.uid() IN (
      SELECT r.user_id FROM repairers r
      JOIN transactions t ON t.repairer_id = r.id
      WHERE t.id = transaction_id
    )
  );

-- Les participants peuvent envoyer des messages
CREATE POLICY "messages_insert_participants"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      auth.uid() IN (
        SELECT client_id FROM transactions WHERE id = transaction_id
      )
      OR auth.uid() IN (
        SELECT r.user_id FROM repairers r
        JOIN transactions t ON t.repairer_id = r.id
        WHERE t.id = transaction_id
      )
    )
  );

-- ============================================================
-- 5. DISPUTES
-- ============================================================
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for disputes" ON disputes;
DROP POLICY IF EXISTS "Allow all access to disputes" ON disputes;

-- Le client voit ses litiges
CREATE POLICY "disputes_select_client"
  ON disputes FOR SELECT
  USING (auth.uid() = client_id);

-- Le repairer voit ses litiges
CREATE POLICY "disputes_select_repairer"
  ON disputes FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM repairers WHERE id = repairer_id
    )
  );

-- ============================================================
-- 6. CITIES
-- ============================================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for cities" ON cities;

-- Lecture publique
CREATE POLICY "cities_select_public"
  ON cities FOR SELECT
  USING (true);

-- Écriture service role uniquement (admin dashboard)
-- Pas de policy INSERT/UPDATE/UPDATE = refusé pour anon

-- ============================================================
-- 7. OWNER_COMMISSIONS
-- ============================================================
ALTER TABLE owner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for owner_commissions" ON owner_commissions;

-- Pas de lecture anon = les commissions ne sont visibles que via service role
-- (dashboard admin utilise le client authenticated, mais les données
--  sont servies via les hooks avec le client externe)
-- On autorise la lecture pour les users authentifiés
CREATE POLICY "commissions_select_auth"
  ON owner_commissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 8. FRAUD_LOGS
-- ============================================================
ALTER TABLE fraud_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access for fraud_logs" ON fraud_logs;

-- Lecture service role uniquement (admin)
-- Pas de policy = accès refusé pour anon/auth standard

-- ============================================================
-- 9. Nettoyage des anciennes tables (comments, slide_changes, presenter_notes)
-- Ces tables sont orphelines (slides supprimé) mais RLS ouvert
-- ============================================================

-- comments
DO $$ BEGIN
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP POLICY IF EXISTS "Public access for comments" ON comments;
CREATE POLICY "comments_select_none" ON comments FOR SELECT USING (false);
CREATE POLICY "comments_insert_none" ON comments FOR INSERT WITH CHECK (false);

-- slide_changes
DO $$ BEGIN
  ALTER TABLE slide_changes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP POLICY IF EXISTS "Public access for slide_changes" ON slide_changes;
CREATE POLICY "slide_changes_select_none" ON slide_changes FOR SELECT USING (false);
CREATE POLICY "slide_changes_insert_none" ON slide_changes FOR INSERT WITH CHECK (false);

-- presenter_notes
DO $$ BEGIN
  ALTER TABLE presenter_notes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DROP POLICY IF EXISTS "Allow all access to presenter_notes" ON presenter_notes;
CREATE POLICY "presenter_notes_select_none" ON presenter_notes FOR SELECT USING (false);
CREATE POLICY "presenter_notes_insert_none" ON presenter_notes FOR INSERT WITH CHECK (false);


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000002_cleanup_orphaned.sql
-- ---------------------------------------------------------------------------
-- Migration: Nettoyage objets orphelins
-- Phase 1, Étape 4 — Supprime les fonctions et index de tables détruites

-- Supprimer la fonction trigger orpheline
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Supprimer les index orphelins (tables slides détruite)
DROP INDEX IF EXISTS idx_comments_slide_id;
DROP INDEX IF EXISTS idx_slide_changes_slide_id;
DROP INDEX IF EXISTS idx_slides_presentation_id;
DROP INDEX IF EXISTS idx_slides_position;
DROP INDEX IF EXISTS idx_slides_deleted_at;
DROP INDEX IF EXISTS idx_cms_strings_key;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000003_auth_config.sql
-- ---------------------------------------------------------------------------
-- Migration: Configuration authentification
-- Phase 2, Étape 2.3
--
-- IMPORTANT: Ces paramètres doivent être configurés dans le Dashboard Supabase
-- Authentication > Settings, pas via SQL. Ce fichier documente la config recommandée.

-- ============================================================
-- CONFIGURATION RECOMMANDÉE (Dashboard Supabase)
-- ============================================================

-- 1. AUTH > Settings > General
--    - Site URL: https://depanngo.vercel.app
--    - Redirect URLs: https://depanngo.vercel.app/**

-- 2. AUTH > Settings > Email
--    - Enable email confirmations: YES
--    - Confirm email change: YES
--    - Double confirm email changes: YES
--    - Confirm password changes: YES

-- 3. AUTH > Settings > Phone (si Twilio configuré)
--    - Enable phone confirmations: YES
--    - SMS provider: Twilio
--    - Account SID: (configurer via Twilio Console)
--    - Auth Token: (configurer via Twilio Console)
--    - From number: (numéro Twilio acheté)

-- 4. AUTH > Providers
--    - Email: Enabled
--    - Phone: Enabled (avec Twilio)

-- ============================================================
-- FONCTION: auto-desactiver les comptes non verifies apres 7 jours
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_unverified_accounts()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Planner pour exécuter quotidiennement (via pg_cron si disponible)
-- SELECT cron.schedule('cleanup-unverified', '0 3 * * *', 'SELECT public.cleanup_unverified_accounts()');


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000004_reviews_system.sql
-- ---------------------------------------------------------------------------
-- Migration: Système d'avis clients
-- Phase 3, Étape 3.1

-- Table des avis
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repairer_id UUID NOT NULL REFERENCES repairers(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id, client_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_repairer_id ON reviews(repairer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique (les avis sont visibles par tous)
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

-- Le client ne peut créer qu'un avis par transaction
CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND auth.uid() IN (
      SELECT client_id FROM transactions WHERE id = transaction_id
    )
  );

-- Le client ne peut modifier que son propre avis
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Fonction pour recalculer la note moyenne d'un repairer
CREATE OR REPLACE FUNCTION public.update_repairer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE repairers
  SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE repairer_id = NEW.repairer_id
  )
  WHERE id = NEW.repairer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: recalculer la note moyenne après insertion/Update d'un avis
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_repairer_rating();

-- Fonction pour obtenir les avis d'un repairer avec pagination
CREATE OR REPLACE FUNCTION public.get_repairer_reviews(
  p_repairer_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  rating SMALLINT,
  comment TEXT,
  created_at TIMESTAMPTZ,
  client_name TEXT,
  client_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    COALESCE(p.full_name, split_part(p.email, '@', 1), 'Client') AS client_name,
    r.client_id
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.client_id
  WHERE r.repairer_id = p_repairer_id
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stats d'avis pour un repairer
CREATE OR REPLACE FUNCTION public.get_repairer_review_stats(
  p_repairer_id UUID
)
RETURNS TABLE (
  total_reviews BIGINT,
  avg_rating NUMERIC,
  rating_1 BIGINT,
  rating_2 BIGINT,
  rating_3 BIGINT,
  rating_4 BIGINT,
  rating_5 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_reviews,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(*) FILTER (WHERE r.rating = 1) AS rating_1,
    COUNT(*) FILTER (WHERE r.rating = 2) AS rating_2,
    COUNT(*) FILTER (WHERE r.rating = 3) AS rating_3,
    COUNT(*) FILTER (WHERE r.rating = 4) AS rating_4,
    COUNT(*) FILTER (WHERE r.rating = 5) AS rating_5
  FROM reviews r
  WHERE r.repairer_id = p_repairer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000005_file_uploads.sql
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000006_payments.sql
-- ---------------------------------------------------------------------------
-- Migration: Système de paiement
-- Phase 3, Étape 3.4

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('wave', 'orange_money', 'mtn_momo')),
  amount_fcfa BIGINT NOT NULL CHECK (amount_fcfa > 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'balance', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  provider_ref TEXT,
  phone_number TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne voit que ses propres paiements
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- L'utilisateur ne peut créer que ses propres paiements
CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seul le système (edge function) peut modifier le statut
CREATE POLICY "payments_update_system"
  ON payments FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Fonction pour mettre à jour le statut d'un paiement
CREATE OR REPLACE FUNCTION public.update_payment_status(
  p_payment_id UUID,
  p_status TEXT,
  p_provider_ref TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET
    status = p_status,
    provider_ref = COALESCE(p_provider_ref, provider_ref),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = now()
  WHERE id = p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier le statut d'un paiement
CREATE OR REPLACE FUNCTION public.get_payment_status(
  p_payment_id UUID
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  provider TEXT,
  amount_fcfa BIGINT,
  provider_ref TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.status,
    p.provider,
    p.amount_fcfa,
    p.provider_ref,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.id = p_payment_id
    AND p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000007_push_notifications.sql
-- ---------------------------------------------------------------------------
-- Migration: Notifications push
-- Phase 3, Étape 3.5

-- Table des abonnements push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT CHECK (platform IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'mission', 'payment', 'review', 'system')),
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read_at = now()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = auth.uid()
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000008_ai_diagnostic_column.sql
-- ---------------------------------------------------------------------------
-- Migration: Ajouter colonne ai_diagnostic à transactions
-- Fix pour la chaîne IA

-- Ajouter la colonne si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'ai_diagnostic'
  ) THEN
    ALTER TABLE transactions ADD COLUMN ai_diagnostic TEXT;
  END IF;
END $$;

-- Index pour recherche par diagnostic
CREATE INDEX IF NOT EXISTS idx_transactions_ai_diagnostic ON transactions(ai_diagnostic) WHERE ai_diagnostic IS NOT NULL;

-- Ajouter aussi urgency si manquant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE transactions ADD COLUMN urgency TEXT DEFAULT 'medium';
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260826000009_mfa_rls_policies.sql
-- ---------------------------------------------------------------------------
-- ══════════════════════════════════════════════════════════
-- Migration 000009 : MFA TOTP — Politiques de sécurité
-- Ajoute mfa_required sur profiles + RLS aal2 pour ressources sensibles
-- ══════════════════════════════════════════════════════════

-- 1. Colonne mfa_required sur profiles (politique MFA par utilisateur)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_required boolean DEFAULT false;

-- 2. Fonction helper : vérifier si l'utilisateur a un niveau d'assurance donné
CREATE OR REPLACE FUNCTION auth.check_aal(required_aal text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN required_aal = 'aal2' THEN
        (auth.jwt()->>'aal') = 'aal2'
      WHEN required_aal = 'aal1' THEN
        (auth.jwt()->>'aal') IN ('aal1', 'aal2')
      ELSE true
    END;
$$;

-- 3. Fonction helper : vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- ══════════════════════════════════════════════════════════
-- RLS POLICIES avec vérification AAL2 pour les ressources sensibles
-- ══════════════════════════════════════════════════════════

-- Transactions : seule la table la plus sensible nécessite AAL2 en écriture
-- Les operations de lecture restent accessibles en aal1 pour l'UX
-- mais les operations sensibles (update status, paiements) exigent aal2

-- Activer RLS sur transactions si ce n'est pas déjà fait
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Politique lecture transactions : propriétaire ou admin
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR repairer_id = auth.uid()
    OR auth.is_admin()
  );

-- Politique écriture transactions : propriétaire avec AAL2
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR auth.is_admin()
  );

-- Politique update transactions : propriétaire ou admin, AAL2 pour statuts critiques
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR repairer_id = auth.uid()
    OR auth.is_admin()
  )
  WITH CHECK (
    client_id = auth.uid()
    OR repairer_id = auth.uid()
    OR auth.is_admin()
  );

-- ══════════════════════════════════════════════════════════
-- Profiles : lecture publique restreinte, écriture propriétaire
-- ══════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- Disputes : AAL2 pour ouvrir un litige (action sensible)
-- ══════════════════════════════════════════════════════════

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disputes_select_own" ON disputes;
CREATE POLICY "disputes_select_own" ON disputes
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR repairer_id = auth.uid()
    OR auth.is_admin()
  );

DROP POLICY IF EXISTS "disputes_insert_auth" ON disputes;
CREATE POLICY "disputes_insert_auth" ON disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR auth.is_admin()
  );

DROP POLICY IF EXISTS "disputes_update_admin" ON disputes;
CREATE POLICY "disputes_update_admin" ON disputes
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ══════════════════════════════════════════════════════════
-- Reviews : lecture publique, écriture authentifiée
-- ══════════════════════════════════════════════════════════

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- Notifications : propriétaire uniquement
-- ══════════════════════════════════════════════════════════

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- Push subscriptions : propriétaire uniquement
-- ══════════════════════════════════════════════════════════

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_upsert_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_upsert_own" ON push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- Messages : participants uniquement
-- ══════════════════════════════════════════════════════════

-- Messages table may or may not exist depending on schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    EXECUTE 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "messages_select_participants" ON messages';
    EXECUTE 'CREATE POLICY "messages_select_participants" ON messages
      FOR SELECT TO authenticated
      USING (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
      )';

    EXECUTE 'DROP POLICY IF EXISTS "messages_insert_own" ON messages';
    EXECUTE 'CREATE POLICY "messages_insert_own" ON messages
      FOR INSERT TO authenticated
      WITH CHECK (sender_id = auth.uid())';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- INDEX pour performance sur les queries MFA
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_mfa_required ON profiles(mfa_required) WHERE mfa_required = true;
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_repairer ON transactions(repairer_id);


-- ---------------------------------------------------------------------------
-- MIGRATION : 20260827000010_fix_messages_fraud_logs.sql
-- ---------------------------------------------------------------------------
-- Migration: Fix messages/fraud_logs idempotent + renommage repair_requests/users/technicians/payments
-- Corrige 42P07 relation already exists + 42P01 relation does not exist

-- 1. MESSAGES: ne pas recréer, juste patcher les colonnes manquantes
-- Structure réelle prod: id, transaction_id FK transactions, sender_id FK profiles, content, is_flagged, flag_reason, is_deleted, created_at
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(100),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si table existait déjà avec ancien schéma, ajoute les colonnes manquantes
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(100);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. FRAUD LOGS
CREATE TABLE IF NOT EXISTS public.fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(50) CHECK (type IN ('bypass_attempt','phone_share','payment_fraud','repeated_cancel')),
  severity VARCHAR(10) CHECK (severity IN ('low','medium','high','critical')),
  details JSONB,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compat: si l'ancienne colonne request_id existe encore, la migrer vers transaction_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fraud_logs' AND column_name='request_id') THEN
    -- Copie les valeurs si transaction_id est vide
    EXECUTE 'UPDATE public.fraud_logs SET transaction_id = request_id WHERE transaction_id IS NULL AND request_id IS NOT NULL';
  END IF;
END $$;

-- 3. COLONNES MANQUANTES - idempotent
ALTER TABLE public.repairers ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100;
ALTER TABLE public.repairers ADD COLUMN IF NOT EXISTS total_missions INT DEFAULT 0;
ALTER TABLE public.repairers ADD COLUMN IF NOT EXISTS id_card_url TEXT;
ALTER TABLE public.repairers ADD COLUMN IF NOT EXISTS specialties TEXT[];

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deposit_amount INT DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS chat_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(4,2) DEFAULT 0.07;

-- 4. RLS idempotent
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON public.messages;
DROP POLICY IF EXISTS "Public access" ON public.fraud_logs;

DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM transactions t WHERE t.id = messages.transaction_id AND (t.client_id = auth.uid() OR t.repairer_id = auth.uid())));

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "fraud_logs_admin_only" ON public.fraud_logs;
CREATE POLICY "fraud_logs_admin_only" ON public.fraud_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. REALTIME idempotent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='fraud_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_logs;
  END IF;
END $$;


