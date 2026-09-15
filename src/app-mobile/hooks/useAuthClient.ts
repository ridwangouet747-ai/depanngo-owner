import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export type MFALevel = "aal1" | "aal2" | "unknown";

export function useAuthClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaLevel, setMfaLevel] = useState<MFALevel>("unknown");
  const [hasMFAEnrolled, setHasMFAEnrolled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<Session | null>(null);

  // Garder le ref synchronisé avec le state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const logout = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setMfaLevel("unknown");
    setHasMFAEnrolled(false);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
      window.location.href = "/app/auth";
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Vérifier le niveau MFA — utilise le ref pour éviter le stale closure
  const checkMFA = useCallback(async () => {
    try {
      const { data } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data?.currentLevel) {
        setMfaLevel(data.currentLevel as MFALevel);
      }
      const hasEnrolled = (data?.factors ?? []).some(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );
      setHasMFAEnrolled(hasEnrolled);
    } catch {
      setMfaLevel("unknown");
      setHasMFAEnrolled(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      if (data.session) {
        resetTimer();
        checkMFA();
      }
    });

    const { data: sub } = supabaseClient.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        resetTimer();
        checkMFA();
      } else if (timerRef.current) {
        clearTimeout(timerRef.current);
        setMfaLevel("unknown");
        setHasMFAEnrolled(false);
      }
    });

    // Utilise sessionRef pour éviter le stale closure
    const onActivity = () => {
      if (sessionRef.current) resetTimer();
    };

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("scroll", onActivity);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, [resetTimer, checkMFA]);

  return {
    session,
    user: session?.user ?? (null as User | null),
    loading,
    mfaLevel,
    hasMFAEnrolled,
    checkMFA,
  };
}

export async function signOut() {
  await supabaseClient.auth.signOut();
}
