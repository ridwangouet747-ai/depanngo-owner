import { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-bg min-h-screen w-full max-w-[430px] mx-auto relative overflow-x-hidden">
      <div className="pb-24">
        {children}
      </div>
    </div>
  );
}