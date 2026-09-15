import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabaseClient } from "@/lib/supabaseClient";

const ADMIN_EMAIL = import.meta.env.VITE_SUPABASE_ADMIN_EMAIL;

export function AdminGuard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [needsMFA, setNeedsMFA] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (cancelled) return;

      if (!session) {
        setLoading(false);
        return;
      }

      const userEmail = session.user.email;

      if (ADMIN_EMAIL && userEmail === ADMIN_EMAIL) {
        setAuthorized(true);
      } else {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!cancelled && profile?.is_admin === true) {
          setAuthorized(true);
        }
      }

      // Vérifier le niveau MFA
      try {
        const { data: mfaData } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
        const hasEnrolled = (mfaData?.factors ?? []).some(
          (f) => f.factor_type === "totp" && f.status === "verified"
        );
        if (hasEnrolled && mfaData?.currentLevel === "aal1" && !cancelled) {
          setNeedsMFA(true);
        }
      } catch {
        // Ignorer — on continue sans MFA check
      }

      if (!cancelled) setLoading(false);
    }

    check();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si la 2FA est activée mais pas encore vérifiée, rediriger vers le challenge MFA
  if (needsMFA) {
    return <Navigate to="/app/mfa/challenge" replace />;
  }

  return <Outlet />;
}
