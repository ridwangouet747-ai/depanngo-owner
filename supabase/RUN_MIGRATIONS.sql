-- ================================================================
-- MIGRATIONS À EXÉCUTER DANS L'ORDRE
-- Dashboard Supabase → SQL Editor → New Query
-- ================================================================

-- 1. Sécurité + role admin + trust_score default
-- Fichier: 20260826000000_security_admin_role.sql

-- 2. RLS complet pour toutes les tables
-- Fichier: 20260826000001_rls_complete.sql

-- 3. Nettoyage données orphelines
-- Fichier: 20260826000002_cleanup_orphaned.sql

-- 4. Configuration auth (documentaire)
-- Fichier: 20260826000003_auth_config.sql

-- 5. Système d'avis clients
-- Fichier: 20260826000004_reviews_system.sql

-- 6. Upload fichiers (CNI + photos)
-- Fichier: 20260826000005_file_uploads.sql

-- 7. Système de paiement
-- Fichier: 20260826000006_payments.sql

-- 8. Notifications push
-- Fichier: 20260826000007_push_notifications.sql

-- ================================================================
-- APRÈS LES MIGRATIONS
-- ================================================================
-- 1. Configurer Twilio dans Authentication → Providers → Phone
-- 2. Configurer les redirect URLs dans Authentication → Settings
-- 3. Créer des comptes Wave/Orange Money/MTN MoMo Business
-- 4. Configurer Firebase pour les notifications push
-- 5. Mettre à jour ALLOWED_ORIGIN dans les edge functions si nécessaire
