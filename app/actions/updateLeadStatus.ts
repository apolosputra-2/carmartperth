"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(
  leadId: number,
  status: string
) {
  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      status: status as any,
    },
  });

  revalidatePath("/");
}