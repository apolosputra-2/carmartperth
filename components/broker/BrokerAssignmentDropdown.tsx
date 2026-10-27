
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";

type Broker = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  isActive?: boolean;
};

type Props = {
  applicationId: string;
  currentBrokerId: string | null;
};

export default function BrokerAssignmentDropdown({
  applicationId,
  currentBrokerId,
}: Props) {
  const router = useRouter();

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState(
    currentBrokerId ?? ""
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setSelectedBrokerId(currentBrokerId ?? "");
  }, [currentBrokerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrokers() {
      try {
        const response = await fetch("/api/broker/portal-users", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load brokers.");
        }

        const data = await response.json();

        // Handle either an array or a wrapped users response.
        const users: Broker[] = Array.isArray(data)
        ? data
        : Array.isArray(data.brokers)
            ? data.brokers
            : Array.isArray(data.users)
            ? data.users
            : [];

        const activeBrokers = users.filter(
        (user) =>
            (user.role === undefined || user.role === "BROKER") &&
            user.isActive !== false
        );

        if (!cancelled) {
          setBrokers(activeBrokers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load brokers."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBrokers();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAssignment() {
    if (
      saving ||
      !selectedBrokerId ||
      selectedBrokerId === currentBrokerId
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/broker/applications/${applicationId}/assign-broker`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brokerId: selectedBrokerId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to assign broker."
        );
      }

      setSuccess("Broker assignment updated successfully.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to assign broker."
      );
    } finally {
      setSaving(false);
    }
  }

    const unchanged =
    !selectedBrokerId ||
    selectedBrokerId === currentBrokerId;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
        {currentBrokerId ? "Reassign Broker" : "Assign Broker"}
      </label>

      <div className="relative">
        <select
          value={selectedBrokerId}
          onChange={(event) => {
            setSelectedBrokerId(event.target.value);
            setError("");
            setSuccess("");
          }}
          disabled={loading || saving}
          className="w-full appearance-none rounded-lg border border-[#353640] bg-[#202127] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-cyan-500 disabled:opacity-50"
        >
          <option value="">
            {loading ? "Loading brokers..." : "Select a broker..."}
          </option>

            {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                    {broker.name} — {broker.email || "No email"} —{" "}
                    {broker.phone || "No phone"}
                </option>
            ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

    <button
        type="button"
        onClick={saveAssignment}
        disabled={unchanged || saving || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving
        ? "Saving..."
        : currentBrokerId
            ? "Reassign Broker"
            : "Assign Broker"}
    </button>

    {error && (
        <p className="text-xs text-red-400">{error}</p>
    )}

    {success && (
        <p className="text-xs text-emerald-400">{success}</p>
    )}
    </div>
  );
}
