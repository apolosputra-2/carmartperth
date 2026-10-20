// updateCustomerDetails.ts


"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

export async function updateCustomerDetails(
  leadId: number,
  details: CustomerDetails
) {
  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    throw new Error("Invalid lead ID");
  }

  const name = details.name.trim();
  const email = details.email.trim();
  const phone = details.phone.trim();
  const dob = details.dateOfBirth;

  if (!name || !email) {
    throw new Error("Name and email are required");
  }

  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new Error("Invalid date of birth");
  }

  const dateOfBirth = dob
    ? new Date(`${dob}T00:00:00.000Z`)
    : null;

  if (
    dateOfBirth &&
    (Number.isNaN(dateOfBirth.getTime()) ||
      dateOfBirth.toISOString().slice(0, 10) !== dob)
  ) {
    throw new Error("Invalid date of birth");
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      name,
      email,
      phone: phone || null,
      dateOfBirth,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return {
    id: updatedLead.id,
    name: updatedLead.name,
    email: updatedLead.email,
    phone: updatedLead.phone,
    dateOfBirth: updatedLead.dateOfBirth?.toISOString() ?? null,
  };
}
