
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const validStatuses = [
  "NEW",
  "HOT",
  "CONTACTED",
  "APPOINTMENT",
  "CONTACT_UNSUCCESSFUL",
  "CONTRACT_SIGNED",
  "WON",
  "DELIVERED",
  "LOST",
] as const;

function isValidStatus(
  value: string
): value is (typeof validStatuses)[number] {
  return validStatuses.some((status) => status === value);
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function updateLeadStatus(
  leadId: number,
  status: string
) {
  if (!isValidStatus(status)) {
    throw new Error("Invalid lead status");
  }

  await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: leadId },
      select: { status: true },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Don't record a change if the status is identical.
    if (lead.status === status) return;

    const now = new Date();

    await tx.lead.update({
      where: { id: leadId },
      data: {
        status,
        ...(status === "CONTRACT_SIGNED"
          ? { contractSignedAt: now }
          : {}),
        ...(status === "WON"
          ? { wonAt: now }
          : {}),
        ...(status === "DELIVERED"
          ? { deliveredAt: now }
          : {}),
        ...(status === "LOST"
          ? { lostAt: now }
          : {}),
      },
    });

    await tx.leadActivity.create({
      data: {
        leadId,
        type: "STATUS_CHANGE",
        content: `Moved: ${statusLabel(lead.status)} → ${statusLabel(status)}`,
      },
    });
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
