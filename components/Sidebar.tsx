
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  CarFront,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const navigation = [
  {
    name: "Daily Insights",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    name: "Broker Portal",
    href: "/broker",
    icon: FileText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#2b2d38] bg-[#111218] text-white">
      {/* Branding */}
      <div className="border-b border-[#2b2d38] px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10">
            <CarFront size={23} className="text-cyan-400" />
          </div>

          <div>
            <h1 className="text-[17px] font-black tracking-tight text-white">
              CARMART
            </h1>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                    : "border border-transparent text-gray-400 hover:bg-[#20222c] hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-cyan-400"
                      : "text-gray-500 group-hover:text-gray-300"
                  }
                />

                <span className="flex-1">{item.name}</span>

                {isActive && (
                  <ChevronRight
                    size={15}
                    className="text-cyan-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-[#2b2d38] px-5 py-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-gray-500" />
          <span className="text-[11px] font-medium text-gray-500">
            Carmart Perth · Internal
          </span>
        </div>

        <p className="mt-2 text-[10px] text-gray-600">
          CRM & Finance Management
        </p>
      </div>
    </aside>
  );
}
