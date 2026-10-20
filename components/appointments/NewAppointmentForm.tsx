
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/app/actions/createAppointment";

type Salesperson = {
  id: number;
  name: string;
};

type AppointmentType =
  | "TEST_DRIVE"
  | "VEHICLE_SELLING"
  | "OTHER";

type NewAppointmentFormProps = {
  onSuccess?: () => void;
};

export default function NewAppointmentForm({
  onSuccess,
}: NewAppointmentFormProps) {
  const router = useRouter();

  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleName, setVehicleName] = useState("");

  const [type, setType] = useState<AppointmentType>("TEST_DRIVE");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [salespersonId, setSalespersonId] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salespeopleError, setSalespeopleError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!customerName.trim()) {
        throw new Error("Customer name is required.");
      }

      if (!date || !time) {
        throw new Error(
          "Please select an appointment date and time."
        );
      }

      // Perth uses UTC+08:00 throughout the year.
      const scheduledAt = `${date}T${time}:00+08:00`;

      await createAppointment({
        leadId: null,
        salespersonId: salespersonId
          ? Number(salespersonId)
          : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        vehicleName: vehicleName.trim(),
        type,
        scheduledAt,
        notes: notes.trim(),
      });

      setSuccess(true);
      router.refresh();
      onSuccess?.();

      // Reset the form after successful submission.
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setVehicleName("");
      setType("TEST_DRIVE");
      setDate("");
      setTime("");
      setSalespersonId("");
      setNotes("");

      // Refresh appointments from PostgreSQL.
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create appointment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-semibold">
        New Appointment
      </h2>

      {/* CUSTOMER DETAILS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="customerName"
            className="mb-1 block text-sm font-medium"
          >
            Customer Name *
          </label>

          <input
            id="customerName"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label
            htmlFor="customerPhone"
            className="mb-1 block text-sm font-medium"
          >
            Phone Number
          </label>

          <input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label
            htmlFor="customerEmail"
            className="mb-1 block text-sm font-medium"
          >
            Email Address
          </label>

          <input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label
            htmlFor="vehicleName"
            className="mb-1 block text-sm font-medium"
          >
            Vehicle
          </label>

          <input
            id="vehicleName"
            type="text"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            placeholder="e.g. 2018 Ford Ranger"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label
            htmlFor="appointmentType"
            className="mb-1 block text-sm font-medium"
          >
            Appointment Type *
          </label>

          <select
            id="appointmentType"
            required
            value={type}
            onChange={(e) =>
              setType(e.target.value as AppointmentType)
            }
            className="w-full rounded-lg border border-gray-300 p-3"
          >
            <option value="TEST_DRIVE">Test Drive</option>
            <option value="VEHICLE_SELLING">Vehicle Selling</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="salesperson"
            className="mb-1 block text-sm font-medium"
          >
            Assigned Salesperson
          </label>

          <select
            id="salesperson"
            value={salespersonId}
            onChange={(e) => setSalespersonId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3"
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

        <div>
          <label
            htmlFor="appointmentDate"
            className="mb-1 block text-sm font-medium"
          >
            Appointment Date *
          </label>

          <input
            id="appointmentDate"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label
            htmlFor="appointmentTime"
            className="mb-1 block text-sm font-medium"
          >
            Appointment Time *
          </label>

          <input
            id="appointmentTime"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>
      </div>

      {/* NOTES */}
      <div>
        <label
          htmlFor="appointmentNotes"
          className="mb-1 block text-sm font-medium"
        >
          Notes
        </label>

        <textarea
          id="appointmentNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional appointment details..."
          className="w-full rounded-lg border border-gray-300 p-3"
        />
      </div>

      {/* ERROR / SUCCESS */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600">
          Appointment created successfully!
        </p>
      )}

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Appointment"}
        </button>
      </div>
    </form>
  );
}
