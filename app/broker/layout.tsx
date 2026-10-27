
import TabLoginGuard from "@/components/auth/TabLoginGuard";

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TabLoginGuard>
      {children}
    </TabLoginGuard>
  );
}
