
import { redirect } from "next/navigation";
import { getPortalUser } from "@/lib/brokerPermissions";
import TabLoginGuard from "@/components/auth/TabLoginGuard";

export const runtime = "nodejs";

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPortalUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "BROKER") {
    redirect("/broker");
  }

  if (user.role !== "STAFF" && user.role !== "BOSS") {
    redirect("/login");
  }

  return <TabLoginGuard>{children}</TabLoginGuard>;
}
