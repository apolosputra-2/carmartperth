
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";

type Invoice = {
  id: string;
  originalName: string;
  sizeBytes: number;
  uploadedAt: string;
};

export default function SettlementInvoiceUpload({
  applicationId,
  canDelete = false,
}: {
  applicationId: string;
  canDelete?: boolean;
}) {

const inputRef = useRef<HTMLInputElement>(null);

const [invoices, setInvoices] = useState<Invoice[]>([]);
const [loading, setLoading] = useState(true);
const [uploading, setUploading] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [dragging, setDragging] = useState(false);
const [error, setError] = useState("");

const endpoint =
`/api/broker/applications/${encodeURIComponent(applicationId)}/settlement-invoice`;

const loadInvoices = useCallback(
async (signal?: AbortSignal) => {
    try {
    const response = await fetch(endpoint, {
        cache: "no-store",
        signal,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Unable to load invoices.");
    }

    if (!signal?.aborted) {
        setInvoices(data.invoices ?? []);
    }
    } catch (err) {
    if (!signal?.aborted) {
        setError(
        err instanceof Error
            ? err.message
            : "Unable to load invoices."
        );
    }
    } finally {
    if (!signal?.aborted) {
        setLoading(false);
    }
    }
},
[endpoint]
);

useEffect(() => {
const controller = new AbortController();
setLoading(true);
setError("");
void loadInvoices(controller.signal);

return () => controller.abort();
}, [loadInvoices]);

async function uploadFile(file: File) {
if (uploading) return;

const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
];

if (!allowed.includes(file.type)) {
    setError("Only PDF, JPG, and PNG files are supported.");
    return;
}

if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    setError("File must be smaller than 10 MB.");
    return;
}

setUploading(true);
setError("");

try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
    throw new Error(
        data.error || "Unable to upload settlement invoice."
    );
    }

    await loadInvoices();
} catch (err) {
    setError(
    err instanceof Error
        ? err.message
        : "Unable to upload settlement invoice."
    );
} finally {
    setUploading(false);

    if (inputRef.current) {
    inputRef.current.value = "";
    }
}
}


async function deleteInvoice(invoice: Invoice) {
  if (!canDelete || deletingId || uploading) return;

  const confirmed = window.confirm(
    `Permanently delete "${invoice.originalName}"?`
  );

  if (!confirmed) return;

  setDeletingId(invoice.id);
  setError("");

  try {
    const response = await fetch(
      `${endpoint}/${encodeURIComponent(invoice.id)}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to delete invoice.");
    }

    setInvoices((previous) =>
      previous.filter((item) => item.id !== invoice.id)
    );
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Unable to delete invoice."
    );
  } finally {
    setDeletingId(null);
  }
}

return (
<div className="w-full min-w-0 space-y-2">
    <p className="text-[11px] font-semibold text-gray-300">
    Settlement Invoice
    </p>

    <input
    ref={inputRef}
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    className="hidden"
    onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void uploadFile(file);
    }}
    />

    <div
    role="button"
    tabIndex={0}
    aria-label="Upload settlement invoice"
    aria-disabled={uploading}
    onClick={() => {
        if (!uploading) inputRef.current?.click();
    }}
    onKeyDown={(event) => {
        if (
        !uploading &&
        (event.key === "Enter" || event.key === " ")
        ) {
        event.preventDefault();
        inputRef.current?.click();
        }
    }}
    onDragOver={(event) => {
        event.preventDefault();
        if (!uploading) setDragging(true);
    }}
    onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
    }}
    onDrop={(event) => {
        event.preventDefault();
        setDragging(false);

          const file = event.dataTransfer.files?.[0];
          if (file && !uploading) void uploadFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-3 text-center transition ${
          dragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-[#4a4d58] hover:border-cyan-500/60"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <UploadCloud size={19} className="text-cyan-400" />

        <span className="text-[11px] font-medium text-gray-300">
          {uploading ? "Uploading..." : "Drop or browse"}
        </span>

        <span className="text-[10px] text-gray-500">
          PDF, JPG, PNG · Max 10 MB
        </span>
      </div>

      {loading ? (
        <p className="text-[10px] text-gray-500">
          Loading invoices...
        </p>
      ) : invoices.length > 0 ? (
        <div className="space-y-1.5">
            {invoices.map((invoice) => (
            <div
                key={invoice.id}
                className="flex min-w-0 items-center gap-1 rounded-md border border-[#353741] bg-[#23252d] p-1"
            >
                <a
                href={`/api/broker/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(invoice.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={invoice.originalName}
                className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-[11px] text-cyan-400 hover:text-cyan-200"
                >
                <FileText size={14} className="shrink-0" />
                <span className="min-w-0 truncate">
                    {invoice.originalName}
                </span>
                </a>

                {canDelete && (
                <button
                    type="button"
                    disabled={deletingId !== null}
                    onClick={() => void deleteInvoice(invoice)}
                    title="Delete settlement invoice"
                    aria-label={`Delete ${invoice.originalName}`}
                    className="shrink-0 rounded-md p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                    <Trash2 size={14} />
                </button>
                )}
            </div>
            ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-500">
          No invoice uploaded
        </p>
      )}

      {error && (
        <p role="alert" className="text-[10px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
