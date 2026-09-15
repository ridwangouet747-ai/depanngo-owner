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
