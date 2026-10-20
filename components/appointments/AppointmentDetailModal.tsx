
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/app/actions/updateAppointment";
import { deleteAppointment } from "@/app/actions/deleteAppointment";

type AppointmentType =
  | "TEST_DRIVE"
  | "VEHICLE_SELLING"
  | "OTHER";

type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type Salesperson = {
  id: number;
  name: string;
};

export type AppointmentDetails = {
  id: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  vehicleName: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  notes: string | null;
  salespersonId: number | null;
  salesperson: {
    name: string;
  } | null;
};

type Props = {
  appointment: AppointmentDetails;
  onClose: () => void;
};

function getPerthDateTime(isoString: string) {
  const date = new Date(isoString);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export default function AppointmentDetailModal({
  appointment,
  onClose,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [salespeopleError, setSalespeopleError] = useState<string | null>(null);

  const initialDateTime = getPerthDateTime(
    appointment.scheduledAt
  );

  const [form, setForm] = useState({
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone ?? "",
    customerEmail: appointment.customerEmail ?? "",
    vehicleName: appointment.vehicleName ?? "",
    type: appointment.type,
    status: appointment.status,
    date: initialDateTime.date,
    time: initialDateTime.time,
    salespersonId: appointment.salespersonId?.toString() ?? "",
    notes: appointment.notes ?? "",
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSalespeople() {
      try {
        const response = await fetch("/api/salespeople", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load salespeople");
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

  const formattedDate = new Date(
    appointment.scheduledAt
  ).toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  
    async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    try {
        await deleteAppointment(appointment.id);

        router.refresh();
        onClose();
    } catch (err) {
        setError(
        err instanceof Error
            ? err.message
            : "Unable to delete appointment."
        );
    } finally {
        setDeleting(false);
    }
    }

  async function handleSave() {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      if (!form.customerName.trim()) {
        throw new Error("Customer name is required.");
      }

      if (!form.date || !form.time) {
        throw new Error("Appointment date and time are required.");
      }

      await updateAppointment({
        id: appointment.id,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        vehicleName: form.vehicleName,
        type: form.type,
        status: form.status,
        salespersonId: form.salespersonId
          ? Number(form.salespersonId)
          : null,
        scheduledAt: `${form.date}T${form.time}:00+08:00`,
        notes: form.notes,
      });

      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update appointment."
      );
    } finally {
      setSaving(false);
    }
  }

  function Detail({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="break-words text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 p-3 text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Appointment Details"
        className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {editing ? "Edit Appointment" : appointment.customerName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Appointment #{appointment.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close appointment details"
            className="text-2xl text-gray-500 hover:text-black disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {!editing ? (
          /* VIEW MODE */
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Detail
                label="Appointment Type"
                value={appointment.type.replaceAll("_", " ")}
              />

              <Detail
                label="Status"
                value={appointment.status.replaceAll("_", " ")}
              />

              <Detail
                label="Date & Time"
                value={formattedDate}
              />

              <Detail
                label="Assigned Salesperson"
                value={
                  appointment.salesperson?.name ?? "Unassigned"
                }
              />

              <Detail
                label="Phone Number"
                value={appointment.customerPhone || "Not provided"}
              />

              <Detail
                label="Email Address"
                value={appointment.customerEmail || "Not provided"}
              />

              <Detail
                label="Vehicle"
                value={appointment.vehicleName || "Not specified"}
              />
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="mb-3 text-sm font-semibold">
                Appointment Notes
              </h3>

              <div className="min-h-24 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                {appointment.notes || "No notes added."}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => {
                    setError(null);
                    setConfirmDelete(true);
                    }}
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Delete Appointment
                </button>
        
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white"
              >
                Edit Appointment
              </button>
              </div>
              
                {confirmDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                    <h3 className="text-lg font-semibold">
                        Delete Appointment?
                    </h3>

                    <p className="mt-3 text-sm text-gray-600">
                        Are you sure you want to permanently delete the
                        appointment for {appointment.customerName}?
                        This action cannot be undone.
                    </p>

                    {error && (
                        <p className="mt-3 text-sm text-red-600">{error}</p>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-lg border px-4 py-2.5 text-sm"
                        >
                        Cancel
                        </button>

                        <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDelete}
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                        {deleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                    </div>
                    </div>
                </div>
                )}
            </div>
          </>
        ) : (
          /* EDIT MODE */
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Customer Name *
                </label>

                <input
                  className={inputClass}
                  value={form.customerName}
                  onChange={(e) =>
                    updateField("customerName", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="tel"
                  className={inputClass}
                  value={form.customerPhone}
                  onChange={(e) =>
                    updateField("customerPhone", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  className={inputClass}
                  value={form.customerEmail}
                  onChange={(e) =>
                    updateField("customerEmail", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Vehicle
                </label>

                <input
                  className={inputClass}
                  value={form.vehicleName}
                  onChange={(e) =>
                    updateField("vehicleName", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Appointment Type
                </label>

                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(e) =>
                    updateField(
                      "type",
                      e.target.value as AppointmentType
                    )
                  }
                >
                  <option value="TEST_DRIVE">Test Drive</option>
                  <option value="VEHICLE_SELLING">
                    Vehicle Selling
                  </option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Appointment Status
                </label>

                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value as AppointmentStatus
                    )
                  }
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Appointment Date
                </label>

                <input
                  type="date"
                  className={inputClass}
                  value={form.date}
                  onChange={(e) =>
                    updateField("date", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Appointment Time
                </label>

                <input
                  type="time"
                  className={inputClass}
                  value={form.time}
                  onChange={(e) =>
                    updateField("time", e.target.value)
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Assigned Salesperson
                </label>

                <select
                  className={inputClass}
                  value={form.salespersonId}
                  disabled={!!salespeopleError}
                  onChange={(e) =>
                    updateField("salespersonId", e.target.value)
                  }
                >
                  <option value="">Unassigned</option>

                  {salespeople.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>

                {salespeopleError && (
                  <p className="mt-1 text-sm text-red-600">
                    {salespeopleError}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Appointment Notes
                </label>

                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.notes}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
                  }
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
