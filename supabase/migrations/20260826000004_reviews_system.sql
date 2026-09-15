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
