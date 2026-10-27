
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FinanceApplicationStatus } from "@prisma/client";

type Props = {
  applicationId: string;
  currentStatus: FinanceApplicationStatus;
  canEdit: boolean;
};

const statusOptions: {
  value: FinanceApplicationStatus;
  label: string;
}[] = [
  { value: "SENT_TO_BROKER", label: "Sent to Broker" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  {
    value: "ADDITIONAL_INFO_REQUIRED",
    label: "Additional Info Required",
  },
  { value: "SENT_TO_LENDER", label: "Sent to Lender" },
  {
    value: "CONDITIONALLY_APPROVED",
    label: "Conditionally Approved",
  },
  { value: "APPROVED", label: "Approved" },
  { value: "DECLINED", label: "Declined" },
  { value: "SETTLED", label: "Settled" },
];

function statusLabel(status: FinanceApplicationStatus) {
  return (
    statusOptions.find((item) => item.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

export default function FinanceStatusControl({
  applicationId,
  currentStatus,
  canEdit,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasStatusChange =
    status !== "" && status !== currentStatus;

  const hasNote = note.trim().length > 0;

  const canSave =
    canEdit && !saving && (hasStatusChange || hasNote);

  async function saveStatus() {
    if (!canSave) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/broker/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: hasStatusChange ? status : currentStatus,
            note: note.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to save the update."
        );
      }

      setStatus("");
      setNote("");
      setSuccess(
        hasStatusChange
          ? "Finance status updated successfully."
          : "Note saved successfully."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the update."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">
          {statusLabel(currentStatus)}
        </p>
        <p className="text-xs text-gray-500">
          Only the assigned broker can update finance status
          or add notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Current status:{" "}
        <span className="font-semibold text-white">
          {statusLabel(currentStatus)}
        </span>
      </p>

      <select
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setError("");
          setSuccess("");
        }}
        disabled={saving}
        className="w-full rounded-lg border border-[#34343e] bg-[#0b0c11] p-3 text-sm text-white outline-none focus:border-cyan-500"
      >
        <option value="">Keep current status</option>

        {statusOptions
          .filter((item) => item.value !== currentStatus)
          .map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
      </select>

      <textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setError("");
          setSuccess("");
        }}
        disabled={saving}
        rows={3}
        maxLength={2000}
        placeholder="Add a note (optional when changing status)..."
        className="w-full resize-y rounded-lg border border-[#34343e] bg-[#0b0c11] p-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-500"
      />

      <button
        type="button"
        onClick={saveStatus}
        disabled={!canSave}
        className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving
          ? "Saving..."
          : hasStatusChange
            ? "Update Status"
            : "Save Note"}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-xs text-emerald-400">
          {success}
        </p>
      )}
    </div>
  );
}
