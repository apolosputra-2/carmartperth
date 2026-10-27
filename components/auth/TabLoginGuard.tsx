
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TabLoginGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const tabLogin = sessionStorage.getItem(
      "carmart-tab-login"
    );

    if (tabLogin !== "true") {
      window.location.replace("/login");
      return;
    }

    setAllowed(true);
  }, [pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c11] text-sm text-gray-400">
        Verifying portal access...
      </div>
    );
  }

  return <>{children}</>;
}
