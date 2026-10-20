
"use client";

import { useMemo, useState } from "react";
import LeadDetailModal from "./LeadDetailModal";

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  vehicleName: string | null;
  dateOfBirth: Date | null;
  salespersonId: number | null;
  salesperson: {
    id: number;
    name: string;
  } | null;
  source: string | null;
  status: string;
  notes: string | null;
  lastContactedAt: Date | null;
};

const columns = [
  {
    status: "NEW",
    title: "New Lead",
    color: "#a78bfa",
    background: "#302544",
  },
  {
    status: "HOT",
    title: "Hot Lead",
    color: "#fb923c",
    background: "#422b1d",
  },
  {
    status: "CONTACTED",
    title: "Contacted",
    color: "#38bdf8",
    background: "#193747",
  },
  {
    status: "APPOINTMENT",
    title: "Appointment",
    color: "#facc15",
    background: "#41351b",
  },
  {
    status: "CONTACT_UNSUCCESSFUL",
    title: "Contact Unsuccessful",
    color: "#e879f9",
    background: "#402747",
  },
  {
    status: "CONTRACT_SIGNED",
    title: "Contract Signed",
    color: "#818cf8",
    background: "#292f4d",
  },
  {
    status: "WON",
    title: "Won",
    color: "#22d3ee",
    background: "#173c42",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    color: "#34d399",
    background: "#173e32",
  },
];

function getLastContactLabel(value: Date | null) {
  if (!value) return "Never contacted";

  const date = new Date(value);
  const now = new Date();

  const dateKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Perth",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  const today = dateKey(now);
  const contacted = dateKey(date);

  if (contacted === today) return "Today";

  const days = Math.round(
    (Date.parse(today + "T00:00:00Z") -
      Date.parse(contacted + "T00:00:00Z")) /
      86400000
  );

  if (days === 1) return "Yesterday";
  if (days > 1) return `${days} days ago`;
  if (days < 0) return "Upcoming";

  return "Today";
}

export default function LeadBoard({
  leads,
}: {
  leads: Lead[];
}) {
  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [search, setSearch] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [salespersonFilter, setSalespersonFilter] =
    useState("ALL");
  const [sortOrder, setSortOrder] =
    useState("DEFAULT");

  // Temporary until CRM authentication is implemented.
  const currentSalespersonId = 4;

  const salespeople = useMemo(() => {
    const unique = new Map<number, string>();

    leads.forEach((lead) => {
      if (lead.salesperson) {
        unique.set(
          lead.salesperson.id,
          lead.salesperson.name
        );
      }
    });

    return Array.from(unique.entries()).sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [leads]);

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = leads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.email,
        lead.phone,
        lead.vehicleName,
        lead.source,
        lead.salesperson?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesMine =
        !showOnlyMine ||
        lead.salespersonId === currentSalespersonId;

      const matchesSalesperson =
        salespersonFilter === "ALL" ||
        (salespersonFilter === "UNASSIGNED"
          ? lead.salespersonId === null
          : lead.salespersonId ===
            Number(salespersonFilter));

      return (
        matchesSearch &&
        matchesMine &&
        matchesSalesperson
      );
    });

    if (sortOrder === "NAME_ASC") {
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    if (sortOrder === "NAME_DESC") {
      filtered.sort((a, b) =>
        b.name.localeCompare(a.name)
      );
    }

    if (sortOrder === "CONTACT_OLDEST") {
      filtered.sort(
        (a, b) =>
          (a.lastContactedAt
            ? new Date(a.lastContactedAt).getTime()
            : 0) -
          (b.lastContactedAt
            ? new Date(b.lastContactedAt).getTime()
            : 0)
      );
    }

    return filtered;
  }, [
    leads,
    search,
    showOnlyMine,
    salespersonFilter,
    sortOrder,
  ]);

  const selectClass =
    "rounded-lg border border-[#394440] bg-[#19211f] px-3 py-2 text-xs text-gray-200 outline-none focus:border-lime-400";

  function renderLeadCard(lead: Lead, accent: string) {
    return (
      <button
        key={lead.id}
        type="button"
        onClick={() => setSelectedLead(lead)}
        className="block w-full rounded-md border border-[#37433f] bg-[#151c1a] p-3 text-left transition hover:border-[#8c9d92] hover:bg-[#202a26] focus:outline-none focus:ring-1 focus:ring-lime-400"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: accent,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {lead.name}
            </p>
            <p className="mt-1 truncate text-[11px] text-gray-400">
              {lead.vehicleName || "No vehicle specified"}
            </p>
          </div>

          <span className="shrink-0 rounded border border-[#35433c] px-1.5 py-0.5 text-[9px] text-gray-400">
            #{lead.id}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {lead.source && (
            <span className="max-w-full truncate rounded bg-[#27332e] px-2 py-0.5 text-[10px] text-gray-300">
              {lead.source}
            </span>
          )}

          {lead.phone && (
            <span className="rounded bg-[#27332e] px-2 py-0.5 text-[10px] text-gray-300">
              {lead.phone}
            </span>
          )}
        </div>

        <p className="mt-2 text-[10px] text-gray-500">
          Last contacted:{" "}
          {getLastContactLabel(lead.lastContactedAt)}
        </p>

        <div className="mt-2 flex items-center gap-2 rounded-md border border-[#394440] bg-[#1c2521] px-2 py-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34452c] text-[9px] font-bold text-lime-300">
            {lead.salesperson?.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "?"}
          </span>

          <span className="min-w-0 flex-1 truncate text-[11px] text-gray-200">
            {lead.salesperson?.name || "Unassigned"}
          </span>
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="w-full min-w-0 rounded-xl bg-[#101715] p-4 text-white">

        {/* PAGE HEADER */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-lime-400">
              Sales & CRM · Leads
            </p>

            <h1 className="text-2xl font-bold">
              Lead Inbox
            </h1>

            <p className="mt-2 text-xs text-gray-400">
              Showing {visibleLeads.length} of{" "}
              {leads.length} dealership leads
            </p>
          </div>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className={`w-[125px] shrink-0 rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${              showOnlyMine
                ? "border-lime-400 bg-lime-400 text-black"
                : "border-[#394440] bg-[#19211f] text-gray-200 hover:border-gray-500"
            }`}
          >
            {showOnlyMine ? "✓ My Leads" : "Whole Team"}
          </button>

          <select
            className={selectClass}
            value={salespersonFilter}
            onChange={(e) =>
              setSalespersonFilter(e.target.value)
            }
          >
            <option value="ALL">Any Teammate</option>
            <option value="UNASSIGNED">Unassigned</option>

            {salespeople.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value)
            }
          >
            <option value="DEFAULT">Default Order</option>
            <option value="NAME_ASC">Name: A–Z</option>
            <option value="NAME_DESC">Name: Z–A</option>
            <option value="CONTACT_OLDEST">
              Least Recently Contacted
            </option>
          </select>

          {(search ||
            showOnlyMine ||
            salespersonFilter !== "ALL" ||
            sortOrder !== "DEFAULT") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShowOnlyMine(false);
                setSalespersonFilter("ALL");
                setSortOrder("DEFAULT");
              }}
              className="rounded-lg border border-[#394440] px-3 py-2 text-xs text-gray-300 hover:bg-[#26332d]"
            >
              Clear Filters
            </button>
          )}

          
          {(search ||
            showOnlyMine ||
            salespersonFilter !== "ALL" ||
            sortOrder !== "DEFAULT") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShowOnlyMine(false);
                setSalespersonFilter("ALL");
                setSortOrder("DEFAULT");
              }}
              className="rounded-lg border border-[#394440] px-3 py-2 text-xs text-gray-300 hover:bg-[#26332d]"
            >
              Clear Filters
            </button>
          )}

          {/* SEARCH BOX — RIGHT SIDE OF FILTER TOOLBAR */}
          <div className="ml-auto w-full sm:w-72">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buyer or vehicle..."
              className="w-full rounded-lg border border-lime-500/70 bg-[#19211f] px-4 py-2.5 text-xs text-white outline-none placeholder:text-gray-500 focus:border-lime-400"
            />
          </div>
        </div>

        {/* FOUR COLUMNS TOP, FOUR COLUMNS BOTTOM */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const columnLeads = visibleLeads.filter(
              (lead) => lead.status === column.status
            );

            return (
              <div
                key={column.status}
                className="min-w-0 overflow-hidden rounded-lg border"
                style={{
                  borderColor: column.color + "65",
                  background: "#1b2420",
                }}
              >
                {/* COLOURED STAGE HEADER */}
                <div
                  className="flex items-center justify-between border-b px-3 py-2.5"
                  style={{
                    backgroundColor: column.background,
                    borderColor: column.color + "50",
                  }}
                >
                  <h2
                    className="truncate pr-2 text-xs font-semibold"
                    style={{ color: column.color }}
                  >
                    {column.title}
                  </h2>

                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      borderColor: column.color + "80",
                      color: column.color,
                    }}
                  >
                    {columnLeads.length}
                  </span>
                </div>

                {/* SCROLLABLE CARDS */}
                <div className="kanban-scroll h-[370px] space-y-2 overflow-y-auto p-2">                  {columnLeads.map((lead) =>
                    renderLeadCard(lead, column.color)
                  )}

                  {columnLeads.length === 0 && (
                    <div className="flex h-24 items-center justify-center text-xs text-gray-500">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOST LEADS */}
        <details className="mt-4 rounded-lg border border-[#394440] bg-[#1b2420]">
          <summary className="cursor-pointer select-none px-4 py-3 text-xs font-semibold text-gray-300">
            Lost Leads (
            {
              visibleLeads.filter(
                (lead) => lead.status === "LOST"
              ).length
            }
            )
          </summary>

          <div className="grid grid-cols-1 gap-2 border-t border-[#394440] p-3 md:grid-cols-2 xl:grid-cols-4">
            {visibleLeads
              .filter((lead) => lead.status === "LOST")
              .map((lead) =>
                renderLeadCard(lead, "#9ca3af")
              )}
          </div>
        </details>
      </div>

      {/* EXISTING LEAD DETAIL MODAL */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
}
