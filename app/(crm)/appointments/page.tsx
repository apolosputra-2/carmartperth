
import { prisma } from "@/lib/prisma";
import NewAppointmentModal from "@/components/appointments/NewAppointmentModal";
import AppointmentView from "@/components/appointments/AppointmentView";

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    include: {
      salesperson: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  const appointmentData = appointments.map((appointment) => ({
    id: appointment.id,
    salespersonId: appointment.salespersonId,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    customerEmail: appointment.customerEmail,
    vehicleName: appointment.vehicleName,
    type: appointment.type,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt.toISOString(),
    notes: appointment.notes,
    salesperson: appointment.salesperson
      ? { name: appointment.salesperson.name }
      : null,
  }));

  return (
    <main className="mx-auto max-w-7xl p-8">
      {/* PAGE HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Appointments
          </h1>

          <p className="mt-2 text-gray-500">
            Manage dealership appointments and customer bookings.
          </p>
        </div>

        <NewAppointmentModal />
      </div>

      {/* CLICKABLE APPOINTMENTS TABLE */}
      <AppointmentView appointments={appointmentData} />
    </main>
  );
}
