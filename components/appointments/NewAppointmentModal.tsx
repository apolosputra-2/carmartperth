
"use client";

import { useState } from "react";
import NewAppointmentForm from "./NewAppointmentForm";

export default function NewAppointmentModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
      >
        + New Appointment
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New Appointment"
            className="relative my-auto w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 z-10 text-2xl text-gray-500 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>

            <NewAppointmentForm
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
