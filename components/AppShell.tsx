
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [role, setRole] = useState<
    "STAFF" | "BOSS" | "BROKER" | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const response = await fetch("/api/broker/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setRole(null);
          return;
        }

        const user = await response.json();

        if (!cancelled) {
          setRole(user.role);
        }
      } catch {
        if (!cancelled) setRole(null);
      }
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

    const isLoginPage =
        pathname === "/login" ||
        pathname.startsWith("/login/");

    const isCustomerFinancePage =
        pathname === "/finance/apply" ||
        pathname.startsWith("/finance/apply/");

    const hideSidebar =
        isLoginPage ||
        isCustomerFinancePage ||
        role === "BROKER";

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
