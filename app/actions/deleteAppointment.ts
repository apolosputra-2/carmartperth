
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteAppointment(appointmentId: number) {
  if (
    !Number.isSafeInteger(appointmentId) ||
    appointmentId <= 0
  ) {
    throw new Error("Invalid appointment ID");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  await prisma.appointment.delete({
    where: { id: appointmentId },
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");

  return { success: true };
}
