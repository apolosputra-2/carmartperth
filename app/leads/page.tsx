import { prisma } from "@/lib/prisma";
import LeadBoard from "@/components/leads/LeadBoard";

export default async function Home() {
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="mb-6 text-3xl font-bold">Leads</h1>

      <LeadBoard leads={leads} />
    </main>
  );
}