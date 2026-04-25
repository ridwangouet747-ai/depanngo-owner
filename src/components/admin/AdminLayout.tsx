import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { toast } from "sonner";

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pathname={pathname}
          onMenuClick={() => setOpen(true)}
          onExport={() => toast.success("Export CSV généré", { description: "Le fichier sera téléchargé sous peu." })}
          onPushMessage={() => toast.success("Message envoyé", { description: "Push notification diffusée à 127 clients." })}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
