import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthClient } from "./hooks/useAuthClient";
import BottomNav from "./BottomNav";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Home = lazy(() => import("./pages/Home"));
const NouvelleDemande = lazy(() => import("./pages/NouvelleDemande"));
const DiagnosticIA = lazy(() => import("./pages/DiagnosticIA"));
const Reparateurs = lazy(() => import("./pages/Reparateurs"));
const ReparateurProfil = lazy(() => import("./pages/ReparateurProfil"));
const Reservation = lazy(() => import("./pages/Reservation"));
const Suivi = lazy(() => import("./pages/Suivi"));
const Missions = lazy(() => import("./pages/Missions"));
const Profil = lazy(() => import("./pages/Profil"));
const Messages = lazy(() => import("./pages/Messages"));
const ProHome = lazy(() => import("./pages/pro/ProHome"));
const ProMissions = lazy(() => import("./pages/pro/ProMissions"));
const ProMissionDetail = lazy(() => import("./pages/pro/ProMissionDetail"));
const ProInscription = lazy(() => import("./pages/pro/ProInscription"));
const ProRevenus = lazy(() => import("./pages/pro/ProRevenus"));
const ProProfil = lazy(() => import("./pages/pro/ProProfil"));

// MFA pages
const MFAChallenge = lazy(() => import("./pages/MFAChallenge"));
const MFAEnrollment = lazy(() => import("./pages/MFAEnrollment"));
const MFASettings = lazy(() => import("./pages/MFASettings"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthClient();
  const { pathname } = useLocation();
  if (loading) return null;
  if (!user && !pathname.startsWith("/app/auth")) {
    return <Navigate to="/app/onboarding" replace />;
  }
  return <>{children}</>;
}

// Guard MFA : si l'utilisateur a la 2FA activée mais n'a pas encore validé le challenge (aal1),
// il est redirigé vers l'écran de vérification.
// Les routes /app/mfa/* sont exemptées pour éviter les boucles.
function MFAGuard({ children }: { children: React.ReactNode }) {
  const { mfaLevel, hasMFAEnrolled, loading } = useAuthClient();
  const { pathname } = useLocation();

  if (loading) return null;

  // Les pages MFA elles-mêmes ne sont pas bloquées
  if (pathname.startsWith("/app/mfa")) {
    return <>{children}</>;
  }

  // Si l'utilisateur a la 2FA activée mais le challenge n'est pas validé
  if (hasMFAEnrolled && mfaLevel === "aal1") {
    return <Navigate to="/app/mfa/challenge" replace />;
  }

  return <>{children}</>;
}

export default function MobileApp() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="home" replace />} />

          {/* --- Routes publiques --- */}
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="auth" element={<Auth />} />
          <Route path="forgot-password" element={<ForgotPassword />} />

          {/* --- Routes MFA (accessibles sans MFA challenge) --- */}
          <Route path="mfa/challenge" element={<ProtectedRoute><MFAChallenge /></ProtectedRoute>} />
          <Route path="mfa/enroll" element={<ProtectedRoute><MFAEnrollment /></ProtectedRoute>} />
          <Route path="mfa/settings" element={<ProtectedRoute><MFAGuard><MFASettings /></MFAGuard></ProtectedRoute>} />

          {/* --- Routes client protégées (avec MFA guard) --- */}
          <Route path="home" element={<ProtectedRoute><MFAGuard><Home /></MFAGuard></ProtectedRoute>} />
          <Route path="nouvelle-demande" element={<ProtectedRoute><MFAGuard><NouvelleDemande /></MFAGuard></ProtectedRoute>} />
          <Route path="diagnostic/:id" element={<ProtectedRoute><MFAGuard><DiagnosticIA /></MFAGuard></ProtectedRoute>} />
          <Route path="reparateurs" element={<ProtectedRoute><MFAGuard><Reparateurs /></MFAGuard></ProtectedRoute>} />
          <Route path="reparateur/:id" element={<ProtectedRoute><MFAGuard><ReparateurProfil /></MFAGuard></ProtectedRoute>} />
          <Route path="reservation/:id" element={<ProtectedRoute><MFAGuard><Reservation /></MFAGuard></ProtectedRoute>} />
          <Route path="suivi/:id" element={<ProtectedRoute><MFAGuard><Suivi /></MFAGuard></ProtectedRoute>} />
          <Route path="missions" element={<ProtectedRoute><MFAGuard><Missions /></MFAGuard></ProtectedRoute>} />
          <Route path="profil" element={<ProtectedRoute><MFAGuard><Profil /></MFAGuard></ProtectedRoute>} />
          <Route path="messages/:id" element={<ProtectedRoute><MFAGuard><Messages /></MFAGuard></ProtectedRoute>} />

          {/* --- Routes espace réparateur (pro) --- */}
          <Route path="pro/inscription" element={<ProInscription />} />
          <Route path="pro/home" element={<ProtectedRoute><MFAGuard><ProHome /></MFAGuard></ProtectedRoute>} />
          <Route path="pro/missions" element={<ProtectedRoute><MFAGuard><ProMissions /></MFAGuard></ProtectedRoute>} />
          <Route path="pro/mission/:id" element={<ProtectedRoute><MFAGuard><ProMissionDetail /></MFAGuard></ProtectedRoute>} />
          <Route path="pro/revenus" element={<ProtectedRoute><MFAGuard><ProRevenus /></MFAGuard></ProtectedRoute>} />
          <Route path="pro/profil" element={<ProtectedRoute><MFAGuard><ProProfil /></MFAGuard></ProtectedRoute>} />
        </Routes>
      </Suspense>

      <BottomNav />
    </>
  );
}
