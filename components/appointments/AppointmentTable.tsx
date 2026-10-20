
"use client";

import { useMemo, useState } from "react";
import AppointmentDetailModal, {
  type AppointmentDetails,
} from "./AppointmentDetailModal";

type Props = {
  appointments: AppointmentDetails[];
};

type StatusFilter =
  | "ALL"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type TypeFilter =
  | "ALL"
  | "TEST_DRIVE"
  | "VEHICLE_SELLING"
  | "OTHER";

export default function AppointmentTable({ appointments }: Props) {
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDetails | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("ALL");
  const [salespersonFilter, setSalespersonFilter] =
    useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const perthFormatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const perthDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const salespeople = useMemo(() => {
    const names = appointments
      .map((appointment) => appointment.salesperson?.name)
      .filter((name): name is string => Boolean(name));

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const searchableText = [
        appointment.customerName,
        appointment.customerPhone,
        appointment.customerEmail,
        appointment.vehicleName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        appointment.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        appointment.type === typeFilter;

      const matchesSalesperson =
        salespersonFilter === "ALL" ||
        (salespersonFilter === "UNASSIGNED"
          ? appointment.salespersonId === null
          : appointment.salesperson?.name === salespersonFilter);

      // Compare using Perth's local calendar date.
      const appointmentDate = perthDateFormatter.format(
        new Date(appointment.scheduledAt)
      );

      const matchesDate =
        !dateFilter || appointmentDate === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesSalesperson &&
        matchesDate
      );
    });
  }, [
    appointments,
    search,
    statusFilter,
    typeFilter,
    salespersonFilter,
    dateFilter,
  ]);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    salespersonFilter !== "ALL" ||
    dateFilter !== "";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSalespersonFilter("ALL");
    setDateFilter("");
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm";

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        {/* HEADER */}
        <div className="border-b p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                All Appointments ({appointments.length})
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredAppointments.length} of{" "}
                {appointments.length} appointments
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* SEARCH */}
          <div className="mt-5">
            <label
              htmlFor="appointment-search"
              className="mb-1 block text-sm font-medium"
            >
              Search Appointments
            </label>

            <input
              id="appointment-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email or vehicle..."
              className={inputClass}
            />
          </div>

          {/* FILTERS */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* STATUS */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className={inputClass}
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>

            {/* APPOINTMENT TYPE */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Appointment Type
              </label>

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as TypeFilter)
                }
                className={inputClass}
              >
                <option value="ALL">All Types</option>
                <option value="TEST_DRIVE">Test Drive</option>
                <option value="VEHICLE_SELLING">Vehicle Selling</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* SALESPERSON */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Salesperson
              </label>

              <select
                value={salespersonFilter}
                onChange={(event) =>
                  setSalespersonFilter(event.target.value)
                }
                className={inputClass}
              >
                <option value="ALL">All Salespeople</option>
                <option value="UNASSIGNED">Unassigned</option>

                {salespeople.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Appointment Date
              </label>

              <input
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* APPOINTMENTS TABLE */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {appointments.length === 0
              ? "No appointments scheduled yet."
              : "No appointments match your filters."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Appointment</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Salesperson</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View appointment for ${appointment.customerName}`}
                    onClick={() =>
                      setSelectedAppointment(appointment)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setSelectedAppointment(appointment);
                      }
                    }}
                    className="cursor-pointer border-t border-gray-100 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <td className="p-4">
                      <div className="font-medium">
                        {appointment.customerName}
                      </div>
                      <div className="text-gray-500">
                        {appointment.customerPhone ?? "No phone"}
                      </div>
                    </td>

                    <td className="p-4">
                      {appointment.type.replaceAll("_", " ")}
                    </td>

                    <td className="p-4">
                      {perthFormatter.format(
                        new Date(appointment.scheduledAt)
                      )}
                    </td>

                    <td className="p-4">
                      {appointment.salesperson?.name ?? "Unassigned"}
                    </td>

                    <td className="p-4">
                      {appointment.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPOINTMENT DETAILS POPUP */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </>
  );
}
