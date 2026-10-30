
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPortalUser,
  applicationAccessFilter,
} from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

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

export async function GET(request: Request) {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    if (
      user.role !== "STAFF" &&
      user.role !== "BOSS" &&
      user.role !== "BROKER"
    ) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const showAll =
      user.role === "STAFF" &&
      searchParams.get("view") === "all";

    const records = await prisma.financeApplication.findMany({
      where: {
        AND: [
          {
            submittedAt: {
              not: null,
            },
          },
          showAll ? {} : applicationAccessFilter(user),
        ],
      },

      select: {
        id: true,
        inquiryNumber:true,
        customerName: true,
        email: true,
        phone: true,
        employmentType: true,
        loanAmount: true,
        status: true,
        submittedAt: true,
        consentRecordedAt: true,
        formData: true,

        // Staff and Broker assignments
        assignedStaffId: true,
        assignedBrokerId: true,

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

        // Actual number of uploaded documents
        _count: {
          select: {
            documents: true,
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

        const weeklyBudget = getNumber(fields.weeklyBudget);

        const consentComplete = Boolean(record.consentRecordedAt);

      return {
        id: record.id,
        inquiryNumber: record.inquiryNumber,
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

        // Staff assignment
        assignedStaffId: record.assignedStaffId,
        assignedStaffName:
          record.assignedStaff?.name ?? null,

        // Broker assignment
        assignedBrokerId: record.assignedBrokerId,
        assignedBrokerName:
          record.assignedBroker?.name ?? null,

        folderName:
          record.assignedBroker?.name ?? "Unfiled",

        // Real document count from PostgreSQL
        documentCount: record._count.documents,

        consentComplete,
      };
    });

        return NextResponse.json(
            { applications },
            {
                headers: {
                "Cache-Control": "private, no-store, max-age=0",
                "Pragma": "no-cache",
                "X-Content-Type-Options": "nosniff",
                },
            }
        );
        } catch (error) {
                logServerError({
                    operation: "broker-applications-list",
                    error,
                });


    return NextResponse.json(
      { error: "Unable to load applications." },
      { status: 500 }
    );
  }
}
