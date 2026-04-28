import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthClient } from "./hooks/useAuthClient";
import { BottomNav } from "./BottomNav";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import NouvelleDemande from "./pages/NouvelleDemande";
import DiagnosticIA from "./pages/DiagnosticIA";
import Reparateurs from "./pages/Reparateurs";
import ReparateurProfil from "./pages/ReparateurProfil";
import Reservation from "./pages/Reservation";
import Suivi from "./pages/Suivi";
import Missions from "./pages/Missions";
import Profil from "./pages/Profil";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthClient();
  const { pathname } = useLocation();
  if (loading) return null;
  // En v1 : on tolère l'accès sans auth pour la démo, mais on redirige vers onboarding si pas de session ET pas de visite récente
  const onboardingDone = typeof window !== "undefined" && localStorage.getItem("dg-onboarding-done");
  if (!user && !onboardingDone && !pathname.startsWith("/app/auth")) {
    return <Navigate to="/app/onboarding" replace />;
  }
  return <>{children}</>;
}

export default function MobileApp() {
  return (
    <>
      <Routes>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="onboarding" element={<OnboardingWithFlag />} />
        <Route path="auth" element={<Auth />} />
        <Route path="home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="nouvelle-demande" element={<ProtectedRoute><NouvelleDemande /></ProtectedRoute>} />
        <Route path="diagnostic/:id" element={<ProtectedRoute><DiagnosticIA /></ProtectedRoute>} />
        <Route path="reparateurs" element={<ProtectedRoute><Reparateurs /></ProtectedRoute>} />
        <Route path="reparateur/:id" element={<ProtectedRoute><ReparateurProfil /></ProtectedRoute>} />
        <Route path="reservation/:id" element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
        <Route path="suivi/:id" element={<ProtectedRoute><Suivi /></ProtectedRoute>} />
        <Route path="missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
        <Route path="profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      </Routes>
      <BottomNav />
    </>
  );
}

function OnboardingWithFlag() {
  if (typeof window !== "undefined") {
    localStorage.setItem("dg-onboarding-done", "1");
  }
  return <Onboarding />;
}
