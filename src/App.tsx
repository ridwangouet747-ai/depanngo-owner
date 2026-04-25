import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Overview from "@/pages/admin/Overview";
import Transactions from "@/pages/admin/Transactions";
import Reparateurs from "@/pages/admin/Reparateurs";
import Clients from "@/pages/admin/Clients";
import Litiges from "@/pages/admin/Litiges";
import Revenus from "@/pages/admin/Revenus";
import Expansion from "@/pages/admin/Expansion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reparateurs" element={<Reparateurs />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/litiges" element={<Litiges />} />
            <Route path="/revenus" element={<Revenus />} />
            <Route path="/expansion" element={<Expansion />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
