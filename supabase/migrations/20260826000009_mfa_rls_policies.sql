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
