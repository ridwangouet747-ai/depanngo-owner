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
