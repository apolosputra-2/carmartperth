"use client";

import { useState } from "react";
import { updateLeadStatus } from "@/app/actions/updateLeadStatus";
import { useRouter } from "next/navigation";
import { updateLastContacted } from "@/app/actions/updateLastContacted";

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

function getLastContactLabel(date: Date | null) {
  if (!date) return "Never";

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const contactDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const diffMs = today.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return `${diffDays} days ago`;
}

const columns = [
  { status: "NEW", title: "New" },
  { status: "HOT", title: "Hot" },
  { status: "CONTACTED", title: "Contacted" },
  { status: "APPOINTMENT", title: "Appointment" },
  { status: "CONTACT_UNSUCCESSFUL", title: "Contact Unsuccessful" },
  { status: "CONTRACT_SIGNED", title: "Contract Signed" },
  { status: "WON", title: "Won" },
  { status: "DELIVERED", title: "Delivered" },
  { status: "LOST", title: "Lost" },
];

export default function LeadBoard({ leads }: { leads: Lead[] }) {
    const router = useRouter();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    //set to See Only Assigned to Me
    const [showOnlyMine, setShowOnlyMine] = useState(false);

    //temporary to test, until login/auth exists
    const currentSalespersonId = 4;
    
    const visibleLeads = showOnlyMine
      ? leads.filter((lead) => lead.salespersonId === currentSalespersonId)
      : leads;

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => setShowOnlyMine(!showOnlyMine)}
          className={`flex items-center gap-2 select-none caret-transparent rounded-full border px-4 py-2 text-sm font-medium ${
            showOnlyMine
              ? "bg-black text-white"
              : "bg-white text-gray-700"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
              showOnlyMine
                ? "border-white"
                : "border-gray-400"
            }`}
          >
            {showOnlyMine && (
              <span className="text-xs">✓</span>
            )}
          </span>

          Show Only My Assigned Leads
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto">
        {columns.map((column) => {
          const columnLeads = visibleLeads.filter(
            (lead) => lead.status === column.status
          );

          return (
            <div
              key={column.status}
              className="min-w-[280px] rounded-lg bg-gray-200 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{column.title}</h2>

                <span className="rounded-full bg-white px-2 py-1 text-sm">
                  {columnLeads.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="block w-full rounded-lg bg-white p-4 text-left shadow-sm hover:shadow-md focus:outline-none"
                  >
                    <h3 className="font-semibold">{lead.name}</h3>

                    <p className="text-sm text-gray-600">
                      {lead.vehicleName ?? "No vehicle"}
                    </p>

                    <p className="mt-2 text-sm">
                      {lead.phone ?? "No phone"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {lead.salesperson?.name ?? "Unassigned"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Last contacted:{" "}
                      {getLastContactLabel(
                        lead.lastContactedAt
                          ? new Date(lead.lastContactedAt)
                          : null
                      )}
                    </p>
                  </button>
                ))}

                {columnLeads.length === 0 && (
                  <p className="text-sm text-gray-500">No leads</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {selectedLead.name}
              </h2>

              <button
                onClick={() => setSelectedLead(null)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {selectedLead.email}
              </p>

              <p>
                <strong>Phone:</strong> {selectedLead.phone ?? "-"}
              </p>

              <p>
                <strong>Vehicle:</strong>{" "}
                {selectedLead.vehicleName ?? "-"}
              </p>

              <p>
                <strong>Source:</strong> {selectedLead.source ?? "-"}
              </p>

              <p>
                <strong>DOB:</strong>{" "}
                {selectedLead.dateOfBirth
                  ? new Date(selectedLead.dateOfBirth).toLocaleDateString()
                  : "-"}
              </p>

              <p>
                <strong>Last contacted:</strong>{" "}
                {selectedLead.lastContactedAt
                  ? new Date(
                      selectedLead.lastContactedAt
                    ).toLocaleString()
                  : "Never"}
              </p>

                <button
                onClick={async () => {
                    await updateLastContacted(
                    selectedLead.id,
                    selectedLead.status
                    );

                    const newStatus =
                    selectedLead.status === "NEW" ||
                    selectedLead.status === "HOT"
                        ? "CONTACTED"
                        : selectedLead.status;

                    setSelectedLead({
                    ...selectedLead,
                    lastContactedAt: new Date(),
                    status: newStatus,
                    });

                    router.refresh();
                }}
                className="rounded bg-blue-600 px-3 py-2 text-white"
                >
                Mark as contacted now
                </button>

              <p>
                <strong>Salesperson:</strong>{" "}
                {selectedLead.salesperson?.name ?? "Unassigned"}
              </p>

                <div>
                <strong>Status:</strong>

                <select
                    value={selectedLead.status}
                    onChange={async (e) => {
                    const newStatus = e.target.value;

                    await updateLeadStatus(
                        selectedLead.id,
                        newStatus
                    );

                    setSelectedLead({
                        ...selectedLead,
                        status: newStatus,
                    });

                    router.refresh();
                    }}
                    className="ml-2 rounded border px-2 py-1"
                >
                    <option value="NEW">New</option>
                    <option value="HOT">Hot</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="APPOINTMENT">Appointment</option>
                    <option value="CONTACT_UNSUCCESSFUL">
                    Contact Unsuccessful
                    </option>
                    <option value="CONTRACT_SIGNED">
                    Contract Signed
                    </option>
                    <option value="WON">Won</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="LOST">Lost</option>
                </select>
                </div>

              <p>
                <strong>Notes:</strong> {selectedLead.notes ?? "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}