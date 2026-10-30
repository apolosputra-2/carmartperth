
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TabLoginGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  const verifyAccess = useCallback(async () => {
    // Hide protected content until verification succeeds.
    setAllowed(false);

    // Check whether this tab has completed login.
    const tabLogin = sessionStorage.getItem("carmart-tab-login");

    if (tabLogin !== "true") {
      window.location.replace("/login");
      return;
    }

    try {
      // Verify the real server-side session.
      const response = await fetch("/api/broker/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        sessionStorage.removeItem("carmart-tab-login");
        window.location.replace("/login");
        return;
      }

      setAllowed(true);
    } catch {
      // Fail closed if authentication cannot be verified.
      setAllowed(false);
      window.location.replace("/login");
    }
  }, []);

  useEffect(() => {
    void verifyAccess();

    // Browser Back / Forward navigation.
    // Revalidate when the browser restores a history entry.
    const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
        window.location.replace("/login");
        return;
    }

    void verifyAccess();
    };
    // Return to the tab after switching away.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifyAccess();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [pathname, verifyAccess]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c11] text-sm text-gray-400">
        Verifying portal access...
      </div>
    );
  }

  return <>{children}</>;
}
