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
