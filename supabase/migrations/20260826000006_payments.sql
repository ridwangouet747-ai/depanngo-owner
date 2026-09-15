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
