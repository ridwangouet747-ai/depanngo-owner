import { useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Factor, AuthMFAEnrollTOTPResponse } from "@supabase/supabase-js";

// ──────────────────────────────────────────────────────────
// useMFA — Hook central pour l'authentification multifacteur
// Gère : multi-facteurs TOTP, challenges, enrôlement, suppression
// ──────────────────────────────────────────────────────────

export type MFALevel = "aal1" | "aal2" | "unknown";

export interface MFAFactor {
  id: string;
  friendly_name: string;
  factor_type: "totp";
  status: "verified" | "unverified";
  created_at: string;
}

interface EnrollResult {
  factorId: string;
  secret: string;
  qrCodeDataUrl: string;
  uri: string;
}

interface MFALevelCheck {
  currentLevel: MFALevel;
  nextLevel: MFALevel;
  hasEnrolledFactors: boolean;
  verifiedFactorCount: number;
  factors: MFAFactor[];
}

// Messages d'erreur TOTP clairs pour l'utilisateur
const TOTP_ERROR_MESSAGES: Record<string, string> = {
  "Invalid TOTP code": "Code incorrect ou expiré. Vérifie que la date et l'heure automatiques sont activées sur ton téléphone.",
  "expired": "Code expiré. Attends le prochain code dans ton application d'authentification.",
  "factor not found": "Facteur d'authentification introuvable. Réessaie ou contacte le support.",
  "challenge expired": "Session de vérification expirée. Redémarre la procédure.",
};

function parseTotpError(raw: string): string {
  for (const [key, msg] of Object.entries(TOTP_ERROR_MESSAGES)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return msg;
  }
  return raw;
}

export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Vérifier le niveau d'assurance MFA actuel ──
  const checkMFALevel = useCallback(async (): Promise<MFALevelCheck> => {
    try {
      const { data, error: mfaError } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;

      const factors: MFAFactor[] = (data?.factors ?? []).map((f: Factor) => ({
        id: f.id,
        friendly_name: f.friendly_name ?? "",
        factor_type: f.factor_type as "totp",
        status: f.status as "verified" | "unverified",
        created_at: f.created_at,
      }));

      const verifiedFactors = factors.filter((f) => f.status === "verified");

      return {
        currentLevel: (data?.currentLevel as MFALevel) ?? "unknown",
        nextLevel: (data?.nextLevel as MFALevel) ?? "unknown",
        hasEnrolledFactors: verifiedFactors.length > 0,
        verifiedFactorCount: verifiedFactors.length,
        factors,
      };
    } catch {
      return {
        currentLevel: "unknown",
        nextLevel: "unknown",
        hasEnrolledFactors: false,
        verifiedFactorCount: 0,
        factors: [],
      };
    }
  }, []);

  // ── Lister les facteurs TOTP ──
  const listFactors = useCallback(async (): Promise<MFAFactor[]> => {
    try {
      const { data, error: mfaError } = await supabaseClient.auth.mfa.listFactors();
      if (mfaError) throw mfaError;

      return (data?.totp ?? []).map((f: Factor) => ({
        id: f.id,
        friendly_name: f.friendly_name ?? "",
        factor_type: "totp" as const,
        status: f.status as "verified" | "unverified",
        created_at: f.created_at,
      }));
    } catch {
      return [];
    }
  }, []);

  // ── Démarrer l'enrôlement TOTP ──
  const enrollTOTP = useCallback(async (friendlyName?: string): Promise<EnrollResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: enrollError } = await supabaseClient.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: friendlyName ?? "DÉPANN'GO Authenticator",
      }) as AuthMFAEnrollTOTPResponse;

      if (enrollError) throw enrollError;
      if (!data?.totp?.uri) throw new Error("Pas de données TOTP retournées");

      // Générer le QR code à partir de l'URI Supabase (jamais inventé)
      const QRCode = await import("qrcode");
      const qrCodeDataUrl = await QRCode.toDataURL(data.totp.uri, {
        width: 256,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });

      return {
        factorId: data.id,
        secret: data.totp.secret,
        qrCodeDataUrl,
        uri: data.totp.uri,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la configuration du MFA";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Vérifier le code TOTP pour finaliser l'enrôlement ──
  const verifyEnrollment = useCallback(async (
    factorId: string,
    code: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabaseClient.auth.mfa.verify({
        factorId,
        code,
      });
      if (verifyError) throw verifyError;

      // Vérifier que la session a bien passé à aal2
      const { data: aalData } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel !== "aal2") {
        console.warn("[MFA] Session still at", aalData?.currentLevel, "after enrollment verify");
      }

      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Code incorrect";
      setError(parseTotpError(msg));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Créer un challenge MFA ──
  const challengeMFA = useCallback(async (
    factorId: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: challengeError } = await supabaseClient.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;
      return data?.id ?? null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la vérification";
      setError(parseTotpError(msg));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Vérifier le code TOTP d'un challenge ──
  const verifyChallenge = useCallback(async (
    factorId: string,
    challengeId: string,
    code: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabaseClient.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (verifyError) throw verifyError;

      // Vérifier que la session est bien à aal2 après vérification
      const { data: aalData } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel !== "aal2") {
        console.warn("[MFA] Session still at", aalData?.currentLevel, "after challenge verify");
      }

      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Code incorrect";
      setError(parseTotpError(msg));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Supprimer un facteur MFA ──
  const unenrollMFA = useCallback(async (factorId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: unenrollError } = await supabaseClient.auth.mfa.unenroll({
        factorId,
      });
      if (unenrollError) throw unenrollError;
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    checkMFALevel,
    listFactors,
    enrollTOTP,
    verifyEnrollment,
    challengeMFA,
    verifyChallenge,
    unenrollMFA,
  };
}
