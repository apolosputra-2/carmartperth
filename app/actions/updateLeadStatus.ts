"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(
  leadId: number,
  status: string
) {
  const data: any = {
    status,
  };

  if (status === "CONTRACT_SIGNED") {
    data.contractSignedAt = new Date();
  }

  if (status === "WON") {
    data.wonAt = new Date();
  }

  if (status === "DELIVERED") {
    data.deliveredAt = new Date();
  }

  if (status === "LOST") {
    data.lostAt = new Date();
  }

  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}