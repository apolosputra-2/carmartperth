"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getPerthDateOnly() {
  const now = new Date();

  const perthDateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${perthDateString}T00:00:00.000Z`);
}

export async function updateLastContacted(
  leadId: number,
  _currentStatus: string
) {
  const now = new Date();
  const contactDate = getPerthDateOnly();

  await prisma.$transaction(async (tx) => {
    // Get the lead's actual current status.
    const lead = await tx.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        salespersonId: true,
        status: true,
      },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // A successful contact moves these statuses to CONTACTED.
    const newStatus =
      lead.status === "NEW" ||
      lead.status === "HOT" ||
      lead.status === "CONTACT_UNSUCCESSFUL"
        ? "CONTACTED"
        : lead.status;

    // Update the lead.
    await tx.lead.update({
      where: {
        id: leadId,
      },
      data: {
        lastContactedAt: now,
        status: newStatus,
      },
    });

    // Keep the Daily Insights tracking working.
    await tx.leadContactDay.upsert({
      where: {
        leadId_contactDate: {
          leadId,
          contactDate,
        },
      },
      create: {
        leadId,
        salespersonId: lead.salespersonId,
        contactDate,
        outcome: "SUCCESSFUL",
        lastContactedAt: now,
      },
      update: {
        salespersonId: lead.salespersonId,
        outcome: "SUCCESSFUL",
        lastContactedAt: now,
      },
    });

    // Record every successful contact attempt.
    await tx.leadActivity.create({
      data: {
        leadId,
        type: "CALL",
        content: "Contacted successfully",
        createdAt: now,
      },
    });

    // Record the status change only if it actually changed.
    if (lead.status !== newStatus) {
      const oldLabel = lead.status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      const newLabel = newStatus
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      await tx.leadActivity.create({
        data: {
          leadId,
          type: "STATUS_CHANGE",
          content: `Moved: ${oldLabel} → ${newLabel}`,
          createdAt: now,
        },
      });
    }
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function markContactUnsuccessful(leadId: number) {
  const now = new Date();
  const contactDate = getPerthDateOnly();

  await prisma.$transaction(async (tx) => {
    // Get the lead's current status and salesperson.
    const lead = await tx.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        salespersonId: true,
        status: true,
      },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Check today's existing contact result.
    const existingContactDay = await tx.leadContactDay.findUnique({
      where: {
        leadId_contactDate: {
          leadId,
          contactDate,
        },
      },
    });

    const alreadySuccessful =
      existingContactDay?.outcome === "SUCCESSFUL";

    const newStatus = "CONTACT_UNSUCCESSFUL";

    // Update the lead's last contacted time and status.
    await tx.lead.update({
      where: {
        id: leadId,
      },
      data: {
        lastContactedAt: now,
        status: newStatus,
      },
    });

    // Keep Daily Insights tracking working.
    await tx.leadContactDay.upsert({
      where: {
        leadId_contactDate: {
          leadId,
          contactDate,
        },
      },
      create: {
        leadId,
        salespersonId: lead.salespersonId,
        contactDate,
        outcome: "UNSUCCESSFUL",
        lastContactedAt: now,
      },
      update: alreadySuccessful
        ? {
            salespersonId: lead.salespersonId,
            lastContactedAt: now,
          }
        : {
            salespersonId: lead.salespersonId,
            outcome: "UNSUCCESSFUL",
            lastContactedAt: now,
          },
    });

    // ALWAYS record a new unsuccessful attempt.
    // This runs even when the status doesn't change.
    await tx.leadActivity.create({
      data: {
        leadId,
        type: "CALL",
        content: "Contact unsuccessful",
        createdAt: now,
      },
    });

    // Record a status change only when one occurred.
    if (lead.status !== newStatus) {
      const oldLabel = lead.status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      const newLabel = newStatus
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      await tx.leadActivity.create({
        data: {
          leadId,
          type: "STATUS_CHANGE",
          content: `Moved: ${oldLabel} → ${newLabel}`,
          createdAt: now,
        },
      });
    }
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
