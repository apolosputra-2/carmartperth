//sidebar.tsx

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white p-6">
      <h1 className="mb-8 text-2xl font-bold">
        Carmart CRM
      </h1>

      <nav className="space-y-2">
        <Link
          href="/dashboard"
          className="block rounded-lg px-4 py-3 hover:bg-gray-100"
        >
          Daily Insights
        </Link>

        <Link
          href="/leads"
          className="block rounded-lg px-4 py-3 hover:bg-gray-100"
        >
          Leads
        </Link>
      </nav>
    </aside>
  );
}