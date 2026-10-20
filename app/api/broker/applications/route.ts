
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPortalUser,
  applicationAccessFilter,
} from "@/lib/brokerPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getObject(value: unknown): Record<string, unknown> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function formatStatus(status: string): string {
  if (status === "SUBMITTED") return "Received";

  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

export async function GET() {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const records = await prisma.financeApplication.findMany({
      where: {
        AND: [
          {
            submittedAt: {
              not: null,
            },
          },
          applicationAccessFilter(user),
        ],
      },

      select: {
        id: true,
        customerName: true,
        email: true,
        phone: true,
        employmentType: true,
        loanAmount: true,
        status: true,
        submittedAt: true,
        consentRecordedAt: true,
        formData: true,

        // Staff assignment ID belongs to FinanceApplication.
        assignedStaffId: true,

        assignedStaff: {
          select: {
            name: true,
          },
        },

        assignedBroker: {
          select: {
            name: true,
            brokerage: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        submittedAt: "desc",
      },

      take: 100,
    });

    const applications = records.map((record) => {
      const data = getObject(record.formData);
      const fields = getObject(data.fields);

      const weeklyBudget = getNumber(
        fields.weeklyBudget
      );

      const consentComplete =
        Boolean(record.consentRecordedAt) &&
        data.smsConsent === true &&
        data.metaConsent === true;

      return {
        id: record.id,
        name: record.customerName ?? "Unknown",
        phone: record.phone,

        email:
          getString(fields.email) ||
          record.email ||
          "",

        employmentType: record.employmentType || "",
        amount: Number(record.loanAmount ?? 0),
        weeklyBudget,

        vehicle:
          getString(fields.vehicle) || "Not selected",

        status: formatStatus(record.status),

        submitted: record.submittedAt
          ? record.submittedAt.toISOString()
          : "",

        // Actual PostgreSQL staff assignment
        assignedStaffId: record.assignedStaffId,
        assignedStaffName:
          record.assignedStaff?.name ?? null,

        // Broker assignment
        assignedBrokerName:
          record.assignedBroker?.name ?? null,

        folderName:
          record.assignedBroker?.brokerage?.name ??
          "Unfiled",

        // Document storage will be implemented later.
        documentCount: 0,

        consentComplete,
      };
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error(
      "Broker applications loading error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to load applications." },
      { status: 500 }
    );
  }
}
