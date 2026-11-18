
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

type Props = {
  applicationId: string;
  customerName: string;
};

export default function RequestApplicationDeletion({
  applicationId,
  customerName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/broker/applications/${encodeURIComponent(applicationId)}/delete`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.error || "Unable to delete application."
        );
      }

      setOpen(false);
      router.replace("/broker");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-xs font-semibold text-red-400 hover:bg-red-500/20"
      >
        <Trash2 size={15} />
        Delete Application
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-xl border border-[#353741] bg-[#191b22] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="delete-title"
                className="text-lg font-bold text-white"
              >
                Delete Application
              </h2>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-5 text-sm text-gray-300">
              Are you sure you want to delete the
              application belonging to:
            </p>

            <p className="mt-3 font-semibold text-white">
              {customerName}
            </p>

            <p className="mt-2 break-all text-xs text-gray-500">
              Application ID: {applicationId}
            </p>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-600 px-4 py-3 text-sm text-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
