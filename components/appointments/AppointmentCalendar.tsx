
"use client";

import { useState } from "react";
import AppointmentDetailModal, {
  type AppointmentDetails,
} from "./AppointmentDetailModal";

type Props = {
  appointments: AppointmentDetails[];
};

type CalendarView = "MONTH" | "WEEK";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

function perthDate(date: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function perthTime(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatHeading(date: Date, view: CalendarView) {
  if (view === "MONTH") {
    return new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  const start = startOfWeek(date);
  const end = addDays(start, 6);

  return `${start.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })} – ${end.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

export default function AppointmentCalendar({
  appointments,
}: Props) {
  const todayKey = perthDate(new Date().toISOString());

  const [currentDate, setCurrentDate] = useState(
    () => new Date(`${perthDate(new Date().toISOString())}T00:00:00Z`)
  );

  const [view, setView] = useState<CalendarView>("MONTH");

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDetails | null>(null);

  const monthStart = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      1
    )
  );

  const firstDay =
    view === "MONTH"
      ? startOfWeek(monthStart)
      : startOfWeek(currentDate);

  const days = Array.from(
    { length: view === "MONTH" ? 42 : 7 },
    (_, index) => addDays(firstDay, index)
  );

  function navigate(direction: number) {
    if (view === "WEEK") {
      setCurrentDate((previous) =>
        addDays(previous, direction * 7)
      );
    } else {
      setCurrentDate((previous) =>
        new Date(
          Date.UTC(
            previous.getUTCFullYear(),
            previous.getUTCMonth() + direction,
            1
          )
        )
      );
    }
  }

  function goToToday() {
    setCurrentDate(
      new Date(`${perthDate(new Date().toISOString())}T00:00:00Z`)
    );
  }

  const appointmentsByDate = new Map<string, AppointmentDetails[]>();

  for (const appointment of appointments) {
    const key = perthDate(appointment.scheduledAt);
    const existing = appointmentsByDate.get(key) ?? [];
    existing.push(appointment);
    appointmentsByDate.set(key, existing);
  }

  for (const dailyAppointments of appointmentsByDate.values()) {
    dailyAppointments.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime()
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        {/* CALENDAR HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">
              {formatHeading(currentDate, view)}
            </h2>
            <p className="text-xs text-gray-500">
              All times shown in Perth time
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Previous period"
              className="rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              ←
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Next period"
              className="rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              →
            </button>

            <select
              value={view}
              onChange={(event) =>
                setView(event.target.value as CalendarView)
              }
              aria-label="Calendar view"
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="MONTH">Month</option>
              <option value="WEEK">Week</option>
            </select>
          </div>
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekdays.map((day) => (
            <div
              key={day}
              className="border-r p-3 text-center text-xs font-semibold text-gray-600 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const dailyAppointments =
              appointmentsByDate.get(key) ?? [];

            const isToday = key === todayKey;
            const outsideMonth =
              view === "MONTH" &&
              day.getUTCMonth() !== currentDate.getUTCMonth();

            return (
              <div
                key={key}
                className={`min-w-0 border-b border-r p-2 ${
                  view === "MONTH"
                    ? "min-h-32"
                    : "min-h-80"
                } ${
                  outsideMonth ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div
                  className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? "bg-black font-semibold text-white"
                      : outsideMonth
                      ? "text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {day.getUTCDate()}
                </div>

                <div className="space-y-1">
                  {dailyAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() =>
                        setSelectedAppointment(appointment)
                      }
                      title={`${appointment.customerName} — ${appointment.type.replaceAll("_", " ")}`}
                      className={`block w-full rounded-md border px-2 py-1.5 text-left text-xs hover:opacity-80 ${
                        appointment.status === "CANCELLED"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : appointment.status === "COMPLETED"
                          ? "border-green-200 bg-green-50 text-green-800"
                          : appointment.status === "NO_SHOW"
                          ? "border-gray-300 bg-gray-100 text-gray-600"
                          : "border-blue-200 bg-blue-50 text-blue-800"
                      }`}
                    >
                      <span className="block font-semibold">
                        {perthTime(appointment.scheduledAt)}
                      </span>

                      <span className="block break-words">
                        {appointment.customerName}
                      </span>

                      {view === "WEEK" && (
                        <span className="mt-1 block text-[10px]">
                          {appointment.type.replaceAll("_", " ")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXISTING APPOINTMENT DETAILS */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </>
  );
}
