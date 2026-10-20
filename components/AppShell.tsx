
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // No sidebar on the login page or Broker Portal
  const hideSidebar =
    pathname === "/login" ||
    pathname.startsWith("/login/");

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="ml-64">{children}</div>
    </>
  );
}
