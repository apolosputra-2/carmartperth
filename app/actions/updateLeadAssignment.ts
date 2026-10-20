
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLeadAssignment(
  leadId: number,
  salespersonId: number | null
) {
  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    throw new Error("Invalid lead ID");
  }

  if (
    salespersonId !== null &&
    (!Number.isSafeInteger(salespersonId) || salespersonId <= 0)
  ) {
    throw new Error("Invalid salesperson ID");
  }

  await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: leadId },
      select: { salespersonId: true },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    if (salespersonId !== null) {
      const salesperson = await tx.salesperson.findUnique({
        where: { id: salespersonId },
        select: { id: true },
      });

      if (!salesperson) {
        throw new Error("Salesperson not found");
      }
    }

    if (lead.salespersonId === salespersonId) {
      return;
    }

    await tx.lead.update({
      where: { id: leadId },
      data: { salespersonId },
    });
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
