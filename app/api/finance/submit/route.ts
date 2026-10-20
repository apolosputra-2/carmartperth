
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedFields = [
  "firstName", "middleName", "lastName", "dob",
  "residency", "marital", "licence", "licenceState",
  "email", "phone", "street", "suburb", "state",
  "postcode", "monthsAtAddress", "livingSituation",
  "rent", "landlord", "landlordPhone",
  "previousAddress", "previousMonths",
  "employment", "income", "employer",
  "employerPhone", "jobTitle", "monthsInRole",
  "previousEmployer", "otherIncome",
  "otherIncomeSource",
  "food", "utilities", "communication",
  "transport", "insurance", "clothing",
  "medical", "childcare", "recreation",
  "otherExpenses", "dependants",
  "loanAmount", "weeklyBudget", "deposit",
  "vehicle", "creditHistory", "additionalNotes",
] as const;

function isLocalDev(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  return (
    process.env.NODE_ENV === "development" &&
    /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(host) &&
    ["localhost", "127.0.0.1"].includes(
      request.nextUrl.hostname
    )
  );
}

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

function readMoney(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

export async function POST(request: NextRequest) {
  // Temporary local-development submission only.
  if (!isLocalDev(request)) {
    return NextResponse.json(
      { error: "Submission is not available on this host." },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || !isRecord(body.form)) {
      return NextResponse.json(
        { error: "Invalid application." },
        { status: 400 }
      );
    }

    const form: Record<string, string> = {};

    for (const key of allowedFields) {
      const value = body.form[key];

      if (value !== undefined && typeof value !== "string") {
        return NextResponse.json(
          { error: `Invalid field: ${key}` },
          { status: 400 }
        );
      }

      form[key] = (value ?? "").trim();

      if (form[key].length > 2000) {
        return NextResponse.json(
          { error: `Field too long: ${key}` },
          { status: 400 }
        );
      }
    }

    const required = [
      "firstName", "lastName", "dob", "email",
      "phone", "street", "suburb", "postcode",
      "state", "residency", "marital", "licence",
      "monthsAtAddress", "livingSituation",
      "rent", "employment", "income",
      "loanAmount", "weeklyBudget",
      "creditHistory",
    ];

    const employed = [
      "Full Time", "Part Time", "Casual",
      "Self Employed", "Contract",
    ].includes(form.employment);

    if (employed) {
      required.push(
        "employer", "employerPhone",
        "jobTitle", "monthsInRole"
      );
    }

    if (
      required.some((key) => !form[key]) ||
      body.consent !== true ||
      typeof body.signature !== "string" ||
      body.signature.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Required application details are missing." },
        { status: 400 }
      );
    }

    const amount = readMoney(form.loanAmount);
    const income = readMoney(form.income);

    if (amount === null || income === null) {
      return NextResponse.json(
        { error: "Invalid loan amount or income." },
        { status: 400 }
      );
    }

    const parseEntries = (value: unknown) => {
      if (!Array.isArray(value) || value.length > 30) {
        throw new Error("Invalid assets or liabilities.");
      }

      return value.map((item) => {
        if (!isRecord(item)) {
          throw new Error("Invalid entry.");
        }

        const entry: Record<string, string> = {};

        for (const key of [
          "type", "description", "amount",
          "monthlyRepayment",
        ]) {
          if (
            item[key] !== undefined &&
            typeof item[key] !== "string"
          ) {
            throw new Error("Invalid entry.");
          }

          entry[key] = String(item[key] ?? "").slice(0, 500);
        }

        return entry;
      });
    };

    const assets = parseEntries(body.assets);
    const liabilities = parseEntries(body.liabilities);

    // Remove hidden conditional values.
    if (Number(form.monthsAtAddress) >= 36) {
      form.previousAddress = "";
      form.previousMonths = "";
    }

    if (!employed) {
      for (const key of [
        "employer", "employerPhone", "jobTitle",
        "monthsInRole", "previousEmployer",
      ]) {
        form[key] = "";
      }
    } else if (Number(form.monthsInRole) >= 3) {
      form.previousEmployer = "";
    }

    if (Number(form.otherIncome) <= 0) {
      form.otherIncomeSource = "";
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const fullName =
      `${form.firstName} ${form.lastName}`.trim();

    const submittedAt = new Date();

    const data = {
      fields: form,
      assets,
      liabilities,
      signature: body.signature.trim(),
      smsConsent: body.smsConsent === true,
      metaConsent: body.metaConsent === true,
      // Documents are deliberately not handled here.
    };

    const application = await prisma.financeApplication.create({
      data: {
        tokenHash,
        customerName: fullName,
        phone: form.phone,
        email: form.email,
        status: "SUBMITTED",
        employmentType: form.employment,
        employer: form.employer || null,
        monthlyIncome: new Prisma.Decimal(income),
        monthlyExpenses: new Prisma.Decimal(
          [
            "food", "utilities", "communication",
            "transport", "insurance", "clothing",
            "medical", "childcare", "recreation",
            "otherExpenses",
          ].reduce(
            (total, key) =>
              total + (readMoney(form[key]) ?? 0),
            0
          )
        ),
        loanAmount: new Prisma.Decimal(amount),
        address: [
          form.street, form.suburb,
          form.state, form.postcode,
        ].filter(Boolean).join(", "),
        applicationType:
          typeof body.applicationType === "string"
            ? body.applicationType.slice(0, 40)
            : "Private",
        applicantType:
          body.applicants === "Joint" ? "Joint" : "Single",
        formData: data,
        consentRecordedAt: submittedAt,
        submittedAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Finance application error:", error);

    return NextResponse.json(
      { error: "Unable to save the test application." },
      { status: 500 }
    );
  }
}
