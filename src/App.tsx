import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const Overview = lazy(() => import("@/pages/admin/Overview"));
const Transactions = lazy(() => import("@/pages/admin/Transactions"));
const Reparateurs = lazy(() => import("@/pages/admin/Reparateurs"));
const Clients = lazy(() => import("@/pages/admin/Clients"));
const Litiges = lazy(() => import("@/pages/admin/Litiges"));
const Revenus = lazy(() => import("@/pages/admin/Revenus"));
const Expansion = lazy(() => import("@/pages/admin/Expansion"));
const MobileApp = lazy(() => import("@/app-mobile/MobileApp"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/app/*" element={<MobileApp />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route path="/" element={<Overview />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/reparateurs" element={<Reparateurs />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/litiges" element={<Litiges />} />
                  <Route path="/revenus" element={<Revenus />} />
                  <Route path="/expansion" element={<Expansion />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
