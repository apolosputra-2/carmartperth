"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLastContacted(
  leadId: number,
  currentStatus: string
) {
  const shouldMoveToContacted =
    currentStatus === "NEW" || currentStatus === "HOT";

  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      lastContactedAt: new Date(),
      ...(shouldMoveToContacted && {
        status: "CONTACTED",
      }),
    },
  });

  revalidatePath("/");
}