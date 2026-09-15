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
