
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const editableKeys = new Set([
  "firstName", "middleName", "lastName", "dob",
  "residency", "marital", "licence", "licenceState",
  "email", "phone", "street", "suburb", "state",
  "postcode", "monthsAtAddress", "livingSituation",
  "rent", "landlord", "landlordPhone",
  "previousAddress", "previousMonths",
  "employment", "employer", "employerPhone",
  "jobTitle", "monthsInRole", "previousEmployer",
  "income", "otherIncome", "otherIncomeSource",
  "food", "utilities", "communication",
  "transport", "insurance", "clothing",
  "medical", "childcare", "recreation",
  "otherExpenses", "dependants",
  "loanAmount", "weeklyBudget", "deposit",
  "vehicle", "creditHistory", "additionalNotes",
]);

const financialKeys = [
  "food", "utilities", "communication",
  "transport", "insurance", "clothing",
  "medical", "childcare", "recreation",
  "otherExpenses",
];

function decimalOrNull(value: string) {
  if (!value.trim()) return null;

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error("Invalid financial amount");
  }

  return new Prisma.Decimal(number);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const host = request.headers.get("host") ?? "";

  if (
    process.env.NODE_ENV !== "development" ||
    !/^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(host) ||
    !["localhost", "127.0.0.1"].includes(
      request.nextUrl.hostname
    )
  ) {
    return NextResponse.json(
      { error: "Local development only." },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.brokerName !== "string" ||
      body.brokerName.trim().length < 2 ||
      body.brokerName.length > 150 ||
      body.authorityConfirmed !== true ||
      !body.fields ||
      typeof body.fields !== "object" ||
      Array.isArray(body.fields)
    ) {
      return NextResponse.json(
        { error: "Broker name, authority confirmation and valid fields are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.financeApplication.findUnique({
      where: { id },
    });

    if (!existing || !existing.submittedAt) {
      return NextResponse.json(
        { error: "Submitted application not found." },
        { status: 404 }
      );
    }

    const original = (
      existing.formData &&
      typeof existing.formData === "object" &&
      !Array.isArray(existing.formData)
        ? existing.formData
        : {}
    ) as Record<string, unknown>;

    const previousFields = (
      original.fields &&
      typeof original.fields === "object" &&
      !Array.isArray(original.fields)
        ? original.fields
        : {}
    ) as Record<string, string>;

    const updatedFields = { ...previousFields };

    for (const [key, value] of Object.entries(
      body.fields as Record<string, unknown>
    )) {
      if (!editableKeys.has(key)) continue;

      if (typeof value !== "string" || value.length > 2000) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }

      updatedFields[key] = value.trim();
    }

    if (
      !updatedFields.firstName ||
      !updatedFields.lastName ||
      !updatedFields.email ||
      !updatedFields.phone
    ) {
      return NextResponse.json(
        { error: "Name, email and phone are required." },
        { status: 400 }
      );
    }

    if (Number(updatedFields.monthsAtAddress) >= 36) {
      updatedFields.previousAddress = "";
      updatedFields.previousMonths = "";
    }

    const employed = [
      "Full Time", "Part Time", "Casual",
      "Self Employed", "Contract",
    ].includes(updatedFields.employment);

    if (!employed) {
      for (const key of [
        "employer", "employerPhone",
        "jobTitle", "monthsInRole", "previousEmployer",
      ]) {
        updatedFields[key] = "";
      }
    } else if (Number(updatedFields.monthsInRole) >= 3) {
      updatedFields.previousEmployer = "";
    }

    if (Number(updatedFields.otherIncome) <= 0) {
      updatedFields.otherIncomeSource = "";
    }

    const changes = Object.keys(updatedFields)
      .filter((key) => updatedFields[key] !== previousFields[key])
      .map((key) => ({
        field: key,
        // Don't write raw personal information into the audit trail.
        changed: true,
      }));

    const income = decimalOrNull(updatedFields.income || "");
    const loanAmount = decimalOrNull(
      updatedFields.loanAmount || ""
    );

    let totalExpenses = new Prisma.Decimal(0);
    for (const key of financialKeys) {
      const value = decimalOrNull(updatedFields[key] || "");
      totalExpenses = totalExpenses.plus(value ?? 0);
    }

    const fullName = [
      updatedFields.firstName,
      updatedFields.middleName,
      updatedFields.lastName,
    ].filter(Boolean).join(" ");

    const auditEntry = {
      event: "BROKER_EDIT",
      brokerName: body.brokerName.trim(),
      authorityConfirmed: true,
      timestamp: new Date().toISOString(),
      changedFields: changes.map((item) => item.field),
    };

    const previousHistory = Array.isArray(original.editHistory)
      ? original.editHistory
      : [];

    await prisma.financeApplication.update({
      where: { id },
      data: {
        customerName: fullName,
        email: updatedFields.email,
        phone: updatedFields.phone,
        employmentType: updatedFields.employment || null,
        employer: updatedFields.employer || null,
        monthlyIncome: income,
        monthlyExpenses: totalExpenses,
        loanAmount,
        address: [
          updatedFields.street,
          updatedFields.suburb,
          updatedFields.state,
          updatedFields.postcode,
        ].filter(Boolean).join(", "),
        formData: {
          ...original,
          fields: updatedFields,
          editHistory: [...previousHistory, auditEntry],
        } as Prisma.InputJsonObject,
      },
    });

    return NextResponse.json({
      success: true,
      changedFields: changes.length,
    });
  } catch (error) {
    console.error("Broker application edit error:", error);

    return NextResponse.json(
      { error: "Could not save application changes." },
      { status: 500 }
    );
  }
}
