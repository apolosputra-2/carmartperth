
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type AppointmentType =
  | "TEST_DRIVE"
  | "VEHICLE_SELLING"
  | "OTHER";

type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type UpdateAppointmentInput = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleName: string;
  type: AppointmentType;
  status: AppointmentStatus;
  salespersonId: number | null;
  scheduledAt: string;
  notes: string;
};

export async function updateAppointment(
  input: UpdateAppointmentInput
) {
  if (!Number.isSafeInteger(input.id) || input.id <= 0) {
    throw new Error("Invalid appointment ID");
  }

  if (!input.customerName.trim()) {
    throw new Error("Customer name is required");
  }

  if (
    !["TEST_DRIVE", "VEHICLE_SELLING", "OTHER"].includes(
      input.type
    )
  ) {
    throw new Error("Invalid appointment type");
  }

  if (
    !["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(
      input.status
    )
  ) {
    throw new Error("Invalid appointment status");
  }

  if (
    input.salespersonId !== null &&
    (!Number.isSafeInteger(input.salespersonId) ||
      input.salespersonId <= 0)
  ) {
    throw new Error("Invalid salesperson ID");
  }

  if (
    typeof input.scheduledAt !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(input.scheduledAt)
  ) {
    throw new Error("Appointment time must include a timezone");
  }

  const scheduledAt = new Date(input.scheduledAt);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid appointment date");
  }

  await prisma.appointment.update({
    where: { id: input.id },
    data: {
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim() || null,
      customerEmail: input.customerEmail.trim() || null,
      vehicleName: input.vehicleName.trim() || null,
      type: input.type,
      status: input.status,
      salespersonId: input.salespersonId,
      scheduledAt,
      notes: input.notes.trim() || null,
    },
  });

  revalidatePath("/appointments");

  return { success: true };
}
