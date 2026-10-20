
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { updateLeadStatus } from "@/app/actions/updateLeadStatus";
import { updateLeadAssignment } from "@/app/actions/updateLeadAssignment";
import { updateCustomerDetails } from "@/app/actions/updateCustomerDetails";
import {
  updateLastContacted,
  markContactUnsuccessful,
} from "@/app/actions/updateLastContacted";

type Salesperson = {
  id: number;
  name: string;
};

type LeadActivity = {
  id: string;
  leadId: number;
  type: "CALL" | "SMS" | "NOTE" | "APPOINTMENT" | "STATUS_CHANGE";
  content: string;
  createdAt: string;
};

type LeadDetailModalProps = {
  lead: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    vehicleName: string | null;
    dateOfBirth: Date | null;
    source: string | null;
    salespersonId: number | null;
    status: string;
    notes: string | null;
  };
  onClose: () => void;
};

const pipeline = [
  { status: "NEW", label: "New", color: "#a78bfa" },
  { status: "HOT", label: "Hot", color: "#fb923c" },
  { status: "CONTACTED", label: "Contacted", color: "#38bdf8" },
  { status: "APPOINTMENT", label: "Appointment", color: "#facc15" },
  {
    status: "CONTACT_UNSUCCESSFUL",
    label: "Contact Unsuccessful",
    color: "#e879f9",
  },
  {
    status: "CONTRACT_SIGNED",
    label: "Contract Signed",
    color: "#818cf8",
  },
  { status: "WON", label: "Won", color: "#22d3ee" },
  { status: "DELIVERED", label: "Delivered", color: "#34d399" },
];

const tabs = ["Overview", "Customer", "Vehicle"] as const;

type Tab = (typeof tabs)[number];

const inputClass =
  "w-full rounded-lg border border-[#394b43] bg-[#151e1a] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-lime-400";

const panelClass =
  "overflow-hidden rounded-xl border border-[#35453c] bg-[#1c2721]";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-300";

function formatActivityDate(date: string) {
  return new Date(date).toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetailModal({
  lead,
  onClose,
}: LeadDetailModalProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [salespeopleError, setSalespeopleError] = useState<string | null>(
    null
  );

  const [assignedSalespersonId, setAssignedSalespersonId] = useState(
    lead.salespersonId?.toString() ?? ""
  );

  const [customerForm, setCustomerForm] = useState({
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    dateOfBirth: lead.dateOfBirth
      ? new Date(lead.dateOfBirth).toISOString().slice(0, 10)
      : "",
  });

  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(
    null
  );

  const [currentStatus, setCurrentStatus] = useState(lead.status);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(
    null
  );

  const [noteInput, setNoteInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(
    null
  );

  // LOAD ACTIVITY HISTORY
  useEffect(() => {
    const controller = new AbortController();

    async function loadActivities() {
      setActivities([]);
      setActivitiesLoading(true);
      setActivitiesError(null);

      try {
        const response = await fetch(
          `/api/leads/${lead.id}/activities`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load activities");
        }

        const data: LeadActivity[] = await response.json();
        setActivities(data);
      } catch {
        if (!controller.signal.aborted) {
          setActivitiesError("Unable to load activity history.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setActivitiesLoading(false);
        }
      }
    }

    loadActivities();

    return () => controller.abort();
  }, [lead.id]);

  // LOAD SALESPEOPLE
  useEffect(() => {
    const controller = new AbortController();

    async function loadSalespeople() {
      setSalespeopleError(null);

      try {
        const response = await fetch("/api/salespeople", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load salespeople");
        }

        const data: Salesperson[] = await response.json();
        setSalespeople(data);
      } catch {
        if (!controller.signal.aborted) {
          setSalespeopleError("Unable to load salespeople.");
        }
      }
    }

    loadSalespeople();

    return () => controller.abort();
  }, []);

  async function refreshActivities() {
    try {
      const response = await fetch(
        `/api/leads/${lead.id}/activities`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data: LeadActivity[] = await response.json();
        setActivities(data);
        setActivitiesError(null);
      }
    } catch {
      // Keep already loaded activities visible.
    }
  }

  // SAVE CUSTOMER AND ASSIGNMENT
  async function saveCustomer() {
    if (customerSaving) return;

    setCustomerSaving(true);
    setCustomerError(null);

    try {
      const salespersonId = assignedSalespersonId
        ? Number(assignedSalespersonId)
        : null;

      await updateCustomerDetails(lead.id, customerForm);
      await updateLeadAssignment(lead.id, salespersonId);

      router.refresh();
      onClose();
    } catch (error) {
      setCustomerError(
        error instanceof Error
          ? error.message
          : "Failed to save customer details."
      );
    } finally {
      setCustomerSaving(false);
    }
  }

  // SAVE NOTE TO POSTGRESQL
  async function saveNote() {
    const content = noteInput.trim();

    if (!content || noteSaving) return;

    setNoteSaving(true);
    setNoteError(null);

    try {
      const response = await fetch(
        `/api/leads/${lead.id}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "NOTE",
            content,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const savedNote: LeadActivity = await response.json();

      setActivities((previous) => [savedNote, ...previous]);
      setNoteInput("");
    } catch {
      setNoteError("Failed to save note. Please try again.");
    } finally {
      setNoteSaving(false);
    }
  }

  // UPDATE PIPELINE
  async function changePipelineStatus(newStatus: string) {
    if (statusSaving || newStatus === currentStatus) return;

    setStatusSaving(true);
    setStatusError(null);

    try {
      await updateLeadStatus(lead.id, newStatus);

      setCurrentStatus(newStatus);
      await refreshActivities();
      router.refresh();
    } catch {
      setStatusError("Unable to update lead status.");
    } finally {
      setStatusSaving(false);
    }
  }

  // QUICK CONTACT
  async function quickContact(
    outcome: "SUCCESSFUL" | "UNSUCCESSFUL"
  ) {
    if (contactSaving || statusSaving) return;

    setContactSaving(true);
    setContactError(null);

    try {
      if (outcome === "SUCCESSFUL") {
        await updateLastContacted(lead.id, currentStatus);
      } else {
        await markContactUnsuccessful(lead.id);
      }

      // Use the database status if the GET endpoint exists.
      const response = await fetch(`/api/leads/${lead.id}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setCurrentStatus(updatedLead.status);
      } else {
        setCurrentStatus(
          outcome === "SUCCESSFUL"
            ? "CONTACTED"
            : "CONTACT_UNSUCCESSFUL"
        );
      }

      await refreshActivities();
      router.refresh();
    } catch {
      setContactError("Unable to record contact. Please try again.");
    } finally {
      setContactSaving(false);
    }
  }

  const activeIndex = pipeline.findIndex(
    (stage) => stage.status === currentStatus
  );

  const currentStage = pipeline.find(
    (stage) => stage.status === currentStatus
  );

  const notes = activities.filter(
    (activity) => activity.type === "NOTE"
  );

  const auditEvents = activities.filter(
    (activity) => activity.type === "STATUS_CHANGE"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details for ${lead.name}`}
        className="my-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[#405046] bg-[#121a16] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="border-b border-[#35453c] bg-[#19221d] px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-400">
                Sales & CRM / Lead Details
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
                  {lead.name}
                </h2>

                <span className="rounded-md border border-[#455549] bg-[#263329] px-2.5 py-1 text-xs text-gray-300">
                  #{lead.id}
                </span>

                <span
                  className="rounded-md px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: currentStage
                      ? `${currentStage.color}22`
                      : "#374151",
                    color: currentStage?.color ?? "#d1d5db",
                    border: `1px solid ${
                      currentStage?.color ?? "#6b7280"
                    }55`,
                  }}
                >
                  {currentStage?.label ??
                    currentStatus.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
                <span>
                  <span className="text-gray-500">Vehicle:</span>{" "}
                  {lead.vehicleName || "Not specified"}
                </span>

                <span>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {lead.phone || "Not provided"}
                </span>

                <span>
                  <span className="text-gray-500">Source:</span>{" "}
                  {lead.source || "Unknown"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-gray-400">
                {lead.email || "No email provided"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close lead details"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#425047] bg-[#26322b] text-xl text-gray-300 transition hover:bg-[#36453b] hover:text-white"
            >
              ×
            </button>
          </div>
        </header>

        {/* SALES PIPELINE */}
        <section className="border-b border-[#35453c] px-5 py-5 sm:px-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Sales Pipeline
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Select a stage to update this lead.
              </p>
            </div>

            {statusSaving && (
              <span className="text-xs text-lime-400">
                Updating pipeline...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {pipeline.map((stage, index) => {
              const isCurrent = currentStatus === stage.status;
              const isCompleted =
                activeIndex >= 0 && index <= activeIndex;

              return (
                <button
                  key={stage.status}
                  type="button"
                  onClick={() =>
                    changePipelineStatus(stage.status)
                  }
                  disabled={statusSaving}
                  aria-pressed={isCurrent}
                  title={`Move lead to ${stage.label}`}
                  className={`min-w-0 rounded-lg border px-2 py-3 text-center transition disabled:cursor-wait disabled:opacity-60 ${
                    isCurrent
                      ? "border-lime-400 bg-[#29392c]"
                      : "border-[#35453c] bg-[#1b2520] hover:border-[#69806a] hover:bg-[#26352b]"
                  }`}
                >
                  <div
                    className="mb-2 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isCompleted
                        ? stage.color
                        : "#3d4b42",
                    }}
                  />

                  <span
                    className={`block text-[11px] leading-4 ${
                      isCurrent
                        ? "font-bold text-lime-300"
                        : "text-gray-400"
                    }`}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>

          {statusError && (
            <p className="mt-3 text-sm text-red-400">
              {statusError}
            </p>
          )}
        </section>

        {/* MAIN BODY */}
        <div className="flex min-h-[480px] flex-col md:flex-row">
          {/* LEFT NAVIGATION */}
          <aside className="w-full shrink-0 border-b border-[#35453c] bg-[#17201b] p-3 md:w-48 md:border-b-0 md:border-r md:p-4">
            <nav className="flex gap-2 md:flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`min-w-0 flex-1 rounded-lg px-4 py-3 text-left text-sm font-medium transition md:flex-none ${
                    activeTab === tab
                      ? "border border-lime-500/40 bg-[#34492f] text-lime-300"
                      : "border border-transparent text-gray-400 hover:bg-[#28372d] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="mt-6 hidden border-t border-[#35453c] pt-4 md:block">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Lead Source
              </p>
              <p className="mt-2 break-words text-xs text-gray-300">
                {lead.source || "Not specified"}
              </p>
            </div>
          </aside>

          {/* TAB CONTENT */}
          <main className="min-w-0 flex-1 bg-[#121a16] p-4 sm:p-6">
            {/* OVERVIEW */}
            {activeTab === "Overview" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Overview
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Manage contact attempts, notes and activity.
                  </p>
                </div>

                {/* QUICK CONTACT */}
                <div className={panelClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35453c] px-5 py-4">
                    <h4 className="font-semibold text-white">
                      Quick Contact
                    </h4>

                    <span className="text-xs text-gray-500">
                      Contact attempts are recorded
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          quickContact("SUCCESSFUL")
                        }
                        disabled={contactSaving || statusSaving}
                        className="rounded-lg bg-lime-500 px-5 py-2.5 text-sm font-semibold text-[#142017] transition hover:bg-lime-400 disabled:opacity-50"
                      >
                        {contactSaving
                          ? "Recording..."
                          : "✓ Contact Successful"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          quickContact("UNSUCCESSFUL")
                        }
                        disabled={contactSaving || statusSaving}
                        className="rounded-lg border border-[#526358] bg-[#29372e] px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-[#35473a] disabled:opacity-50"
                      >
                        {contactSaving
                          ? "Recording..."
                          : "Contact Unsuccessful"}
                      </button>
                    </div>

                    {contactError && (
                      <p className="mt-3 text-sm text-red-400">
                        {contactError}
                      </p>
                    )}
                  </div>
                </div>

                {/* NOTES */}
                <div className={panelClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35453c] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-white">
                        Customer Notes
                      </h4>

                      <span className="rounded-full bg-[#344339] px-2.5 py-0.5 text-xs text-lime-300">
                        {notes.length}
                      </span>
                    </div>

                    <span className="text-xs text-gray-500">
                      {noteSaving
                        ? "Saving..."
                        : "Auto-save enabled"}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    <textarea
                      value={noteInput}
                      onChange={(e) =>
                        setNoteInput(e.target.value)
                      }
                      onBlur={saveNote}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          (e.ctrlKey || e.metaKey)
                        ) {
                          e.preventDefault();
                          saveNote();
                        }
                      }}
                      disabled={noteSaving}
                      placeholder="Write a note about this customer..."
                      rows={3}
                      className={`${inputClass} resize-y`}
                    />

                    <p className="text-xs text-gray-500">
                      Saves when you click away or press Ctrl + Enter.
                    </p>

                    {noteError && (
                      <p className="text-sm text-red-400">
                        {noteError}
                      </p>
                    )}

                    {lead.notes?.trim() && (
                      <div className="rounded-lg border border-[#35453c] bg-[#151f19] p-4">
                        <p className="whitespace-pre-wrap text-sm text-gray-200">
                          {lead.notes}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Original customer notes
                        </p>
                      </div>
                    )}

                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-[#35453c] bg-[#151f19] p-4"
                      >
                        <p className="whitespace-pre-wrap text-sm text-gray-200">
                          {note.content}
                        </p>

                        <p className="mt-3 text-xs text-gray-500">
                          {formatActivityDate(note.createdAt)}
                        </p>
                      </div>
                    ))}

                    {!activitiesLoading &&
                      !lead.notes?.trim() &&
                      notes.length === 0 && (
                        <p className="text-sm text-gray-500">
                          No notes added yet.
                        </p>
                      )}
                  </div>
                </div>

                {/* AUDIT TRAIL */}
                <div className={panelClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#35453c] px-5 py-4">
                    <h4 className="font-semibold text-white">
                      Audit Trail
                    </h4>

                    <span className="text-xs text-gray-500">
                      {auditEvents.length} status events
                    </span>
                  </div>

                  <div className="space-y-3 p-5">
                    {activitiesLoading ? (
                      <p className="text-sm text-gray-400">
                        Loading activity history...
                      </p>
                    ) : activitiesError ? (
                      <p className="text-sm text-red-400">
                        {activitiesError}
                      </p>
                    ) : auditEvents.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[#45564a] bg-[#151f19] p-5 text-sm text-gray-500">
                        No audit events recorded yet.
                      </div>
                    ) : (
                      auditEvents.map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-lg border border-[#35453c] bg-[#151f19] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-lime-300">
                              ↻ Status Changed
                            </span>

                            <span className="text-xs text-gray-500">
                              {formatActivityDate(
                                activity.createdAt
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-300">
                            {activity.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER TAB */}
            {activeTab === "Customer" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Customer Details
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Edit customer information and lead assignment.
                  </p>
                </div>

                <div className={panelClass}>
                  <div className="border-b border-[#35453c] px-5 py-4">
                    <h4 className="font-semibold text-white">
                      Personal Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            name: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Date of Birth
                      </label>

                      <input
                        type="date"
                        value={customerForm.dateOfBirth}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            phone: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Email Address
                      </label>

                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            email: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* ASSIGNMENT */}
                <div className={panelClass}>
                  <div className="border-b border-[#35453c] px-5 py-4">
                    <h4 className="font-semibold text-white">
                      Lead Assignment
                    </h4>
                  </div>

                  <div className="p-5">
                    <label className={labelClass}>
                      Assigned Salesperson
                    </label>

                    <select
                      value={assignedSalespersonId}
                      onChange={(e) =>
                        setAssignedSalespersonId(
                          e.target.value
                        )
                      }
                      disabled={salespeople.length === 0}
                      className={inputClass}
                    >
                      <option value="">Unassigned</option>

                      {salespeople.map((salesperson) => (
                        <option
                          key={salesperson.id}
                          value={salesperson.id}
                        >
                          {salesperson.name}
                        </option>
                      ))}
                    </select>

                    {salespeopleError && (
                      <p className="mt-3 text-sm text-red-400">
                        {salespeopleError}
                      </p>
                    )}
                  </div>
                </div>

                {customerError && (
                  <p className="text-sm text-red-400">
                    {customerError}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-[#35453c] pt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[#45564a] px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-[#29372e]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveCustomer}
                    disabled={customerSaving}
                    className="rounded-lg bg-lime-500 px-6 py-2.5 text-sm font-semibold text-[#142017] transition hover:bg-lime-400 disabled:opacity-50"
                  >
                    {customerSaving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* VEHICLE TAB */}
            {activeTab === "Vehicle" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Vehicle Details
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Vehicle information associated with this lead.
                  </p>
                </div>

                <div className={panelClass}>
                  <div className="border-b border-[#35453c] px-5 py-4">
                    <h4 className="font-semibold text-white">
                      Interested Vehicle
                    </h4>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Vehicle Name
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      {lead.vehicleName || "Not specified"}
                    </p>

                    <div className="mt-5 rounded-lg border border-dashed border-[#45564a] bg-[#151f19] p-4">
                      <p className="text-sm text-gray-400">
                        Live vehicle inventory integration
                        will be available once the inventory
                        API connection is configured.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#35453c] bg-[#17201b] px-5 py-3 sm:px-7">
          <span className="text-xs text-gray-500">
            Carmart Perth · Lead #{lead.id}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#45564a] bg-[#26322b] px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#35473a]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
