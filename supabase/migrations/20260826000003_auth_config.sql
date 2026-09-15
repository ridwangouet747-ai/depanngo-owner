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
