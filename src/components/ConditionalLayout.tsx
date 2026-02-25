"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAgentEditor = pathname?.match(/^\/agents\/[^/]+\/edit/);

  return (
    <>
      {!isAgentEditor && <Sidebar />}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {children}
      </div>
    </>
  );
}
