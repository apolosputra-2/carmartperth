
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type AppointmentType =
  | "TEST_DRIVE"
  | "VEHICLE_SELLING"
  | "OTHER";

type CreateAppointmentInput = {
  leadId?: number | null;
  salespersonId: number | null;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleName?: string;
  type: AppointmentType;
  scheduledAt: string;
  notes?: string;
};

const validTypes: AppointmentType[] = [
  "TEST_DRIVE",
  "VEHICLE_SELLING",
  "OTHER",
];

export async function createAppointment(
  input: CreateAppointmentInput
) {
  const customerName = input.customerName?.trim();

  if (!customerName) {
    throw new Error("Customer name is required");
  }

  if (
    input.leadId != null &&
    (!Number.isSafeInteger(input.leadId) || input.leadId <= 0)
  ) {
    throw new Error("Invalid lead ID");
  }

  if (
    input.salespersonId !== null &&
    (!Number.isSafeInteger(input.salespersonId) ||
      input.salespersonId <= 0)
  ) {
    throw new Error("Invalid salesperson ID");
  }

  if (!validTypes.includes(input.type)) {
    throw new Error("Invalid appointment type");
  }

  // Require an explicit timezone to avoid scheduling
  // appointments at the wrong local time.
  if (
    typeof input.scheduledAt !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(input.scheduledAt)
  ) {
    throw new Error("Appointment time must include a timezone");
  }

  const scheduledAt = new Date(input.scheduledAt);

  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= Date.now()
  ) {
    throw new Error("Choose a valid future appointment time");
  }

  const appointment = await prisma.$transaction(async (tx) => {
    if (input.leadId != null) {
      const lead = await tx.lead.findUnique({
        where: { id: input.leadId },
        select: { id: true },
      });

      if (!lead) {
        throw new Error("Lead not found");
      }
    }

    if (input.salespersonId !== null) {
      const salesperson = await tx.salesperson.findUnique({
        where: { id: input.salespersonId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new Error("Salesperson not found");
      }
    }

    const created = await tx.appointment.create({
      data: {
        leadId: input.leadId ?? null,
        salespersonId: input.salespersonId,
        customerName,
        customerPhone: input.customerPhone?.trim() || null,
        customerEmail: input.customerEmail?.trim() || null,
        vehicleName: input.vehicleName?.trim() || null,
        type: input.type,
        scheduledAt,
        notes: input.notes?.trim() || null,
      },
    });

    // Only log activity when linked to an existing lead.
    if (input.leadId != null) {
      await tx.leadActivity.create({
        data: {
          leadId: input.leadId,
          type: "APPOINTMENT",
          content: `Appointment scheduled: ${input.type.replaceAll(
            "_",
            " "
          )} on ${scheduledAt.toLocaleString("en-AU", {
            timeZone: "Australia/Perth",
            dateStyle: "medium",
            timeStyle: "short",
          })}`,
        },
      });
    }

    return created;
  });

  revalidatePath("/appointments");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { id: appointment.id };
}
