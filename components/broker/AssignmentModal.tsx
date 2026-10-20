
"use client";

import { useEffect, useState } from "react";
import {
  X,
  Users,
  UserRoundCheck,
  UserPlus,
} from "lucide-react";

export type AssignmentOption = {
  id: string;
  name: string;
};

type PortalRole = "STAFF" | "BOSS" | "BROKER";

type Props = {
  open: boolean;
  applicationId: string;
  applicantName: string;
  assignedStaffName?: string | null;
  type: "staff" | "broker";
  options: AssignmentOption[];
  actorRole: PortalRole;
  actorName?: string;
  onClose: () => void;
  onAssigned?: () => void;
};

export default function AssignmentModal({
  open,
  applicationId,
  applicantName,
  assignedStaffName,
  type,
  options,
  actorRole,
  actorName,
  onClose,
  onAssigned,
}: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedId("");
    setSaving(false);
    setError("");
  }, [open, applicationId, type]);

  if (!open) return null;

  const isStaffAssignment = type === "staff";
  const selfAssign =
    isStaffAssignment && actorRole === "STAFF";
  const bossAssign =
    isStaffAssignment && actorRole === "BOSS";
  const brokerAssign =
    type === "broker" && actorRole !== "BROKER";

  const title = selfAssign
    ? "Assign to Myself"
    : isStaffAssignment
      ? "Assign Staff"
      : "Assign Broker";

  async function saveAssignment() {
    if (saving) return;

    if (!selfAssign && !bossAssign) return;

    if (bossAssign && !selectedId) {
      setError("Please choose a staff member.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/broker/applications/${encodeURIComponent(
          applicationId
        )}/assign-staff`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            selfAssign
              ? {}
              : { staffId: selectedId }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to assign staff."
        );
      }

      onClose();
      onAssigned?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-lg border border-[#353641] bg-[#17181f] p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black italic uppercase">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-5 text-gray-400">
              {selfAssign
                ? `Claim ${applicantName}'s application for yourself.`
                : bossAssign
                  ? `Choose the staff member responsible for ${applicantName}'s application.`
                  : `Choose the broker responsible for ${applicantName}'s application.`}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {actorRole === "BROKER" ? (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            Broker accounts cannot assign applications.
          </div>
        ) : selfAssign ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <UserPlus size={18} />
                <span className="text-sm font-semibold">
                  Claim Application
                </span>
              </div>

              {assignedStaffName ? (
                <p className="mt-3 text-sm text-gray-300">
                  Currently assigned to{" "}
                  <span className="font-semibold text-white">
                    {assignedStaffName}
                  </span>
                  .
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-300">
                  This application is currently unassigned.
                  Assign it to yourself?
                </p>
              )}

              {actorName && (
                <p className="mt-2 text-xs text-gray-400">
                  Your account:{" "}
                  <span className="text-white">
                    {actorName}
                  </span>
                </p>
              )}

              <p className="mt-3 text-xs leading-5 text-gray-500">
                Once claimed, other staff members will
                no longer see this application.
              </p>
            </div>

            <button
              type="button"
              disabled={saving || Boolean(assignedStaffName)}
              onClick={saveAssignment}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#4a4352] bg-gradient-to-r from-[#741343] to-[#087487] px-5 py-3 text-sm font-bold uppercase text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={17} />
              {saving ? "Assigning..." : "Assign to Myself"}
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <select
              value={selectedId}
              disabled={saving}
              onChange={(event) =>
                setSelectedId(event.target.value)
              }
              className={`w-full rounded border bg-[#0e0f14] px-3 py-3 text-sm text-white outline-none ${
                isStaffAssignment
                  ? "border-yellow-500/60 focus:border-yellow-400"
                  : "border-cyan-500/60 focus:border-cyan-400"
              }`}
            >
              <option value="">
                {isStaffAssignment
                  ? "Choose a staff member..."
                  : "Choose a broker..."}
              </option>

              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            {options.length === 0 && (
              <p className="text-xs text-amber-400">
                No accounts available to assign.
              </p>
            )}

            {isStaffAssignment && assignedStaffName && (
              <p className="text-xs text-gray-400">
                Current staff: {assignedStaffName}
              </p>
            )}

            <button
              type="button"
              disabled={
                saving ||
                !selectedId ||
                brokerAssign
              }
              onClick={saveAssignment}
              className="flex w-full items-center justify-center gap-2 rounded border border-[#4a4352] bg-gradient-to-r from-[#741343] to-[#087487] px-5 py-3 text-sm font-bold uppercase text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStaffAssignment ? (
                <Users size={17} />
              ) : (
                <UserRoundCheck size={17} />
              )}
              {saving
                ? "Saving..."
                : isStaffAssignment
                  ? "Assign Staff"
                  : "Assign Broker"}
            </button>

            {brokerAssign && (
              <p className="text-center text-xs text-gray-500">
                Broker assignment will be activated in
                the next stage.
              </p>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
