
"use client";

import { useState } from "react";
import AppointmentTable from "./AppointmentTable";
import AppointmentCalendar from "./AppointmentCalendar";
import type { AppointmentDetails } from "./AppointmentDetailModal";

type Props = {
  appointments: AppointmentDetails[];
};

export default function AppointmentView({ appointments }: Props) {
  const [view, setView] = useState<"LIST" | "CALENDAR">("LIST");

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button
            type="button"
            onClick={() => setView("LIST")}
            className={`rounded-md px-5 py-2 text-sm font-medium ${
              view === "LIST"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("CALENDAR")}
            className={`rounded-md px-5 py-2 text-sm font-medium ${
              view === "CALENDAR"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === "CALENDAR" ? (
        <AppointmentCalendar appointments={appointments} />
      ) : (
        <AppointmentTable appointments={appointments} />
      )}
    </div>
  );
}
