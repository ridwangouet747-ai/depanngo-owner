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
