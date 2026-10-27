
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import {
  saveFinanceDocument,
  MAX_DOCUMENT_SIZE,
} from "@/lib/financeDocumentStorage";

export const runtime = "nodejs";

const allowedFields = [
    "firstName", "middleName", "lastName", "dob",
    "residency", "visaSubclass", "marital", "licence", "licenceState",
    "email", "phone", "street", "suburb", "state",
    "postcode", "monthsAtAddress", "livingSituation",
    "rent", "rentFrequency", "landlord", "landlordPhone",
    "employment", "income", "incomeFrequency", "employer",  "employerPhone", "jobTitle", "monthsInRole",
    "previousEmployer", "otherIncome",
    "otherIncomeSource",
    "food", "utilities", "communication",
    "transport", "insurance", "clothing",
    "medical", "childcare", "recreation",
    "otherExpenses", "dependants", "hasLoans",
    "loanAmount", "weeklyBudget", "hasTradeIn", "hasDeposit", "deposit",
    "vehicle", "creditHistory",
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

function formatInquiryNumber(value: number) {
  const padded = String(value).padStart(6, "0");
  return `INQ-${padded.slice(0, 3)}-${padded.slice(3)}`;
}

export async function POST(request: NextRequest) {
  // Temporary local-development submission only.
  if (!isLocalDev(request)) {
    return NextResponse.json(
      { error: "Submission is not available on this host." },
      { status: 403 }
    );
  }

    const storedKeys: string[] = [];

    try {
        const incoming = await request.formData();
        const applicationJson = incoming.get("application");

        if (typeof applicationJson !== "string") {
        return NextResponse.json(
            { error: "Application data is missing." },
            { status: 400 }
        );
        }

        let body: unknown;

        try {
        body = JSON.parse(applicationJson);
        } catch {
        return NextResponse.json(
            { error: "Invalid application data." },
            { status: 400 }
        );
    }

    if (!isRecord(body) || !isRecord(body.form)) {
      return NextResponse.json(
        { error: "Invalid application." },
        { status: 400 }
      );
    }

    const allowedDocumentCategories = new Set([
        // Current finance application documents
        "licenceFront",
        "licenceBack",
        "medicareFront",
        "medicareBack",
        "payslip1",
        "payslip2",

        // Legacy categories for existing applications
        "photoId",
        "payslip",
        "medicare",
        "rates",
        "otherDocument",
    ]);

    const requiredDocumentCategories: string[] = [];

    const documents: Array<{
    category: string;
    file: File;
    }> = [];

    const seenCategories = new Set<string>();

    for (const [key, value] of incoming.entries()) {
    if (key === "application") continue;

    if (!key.startsWith("document_")) {
        return NextResponse.json(
        { error: "Unexpected upload field." },
        { status: 400 }
        );
    }

    const category = key.slice("document_".length);

    if (
        !allowedDocumentCategories.has(category) ||
        seenCategories.has(category) ||
        !(value instanceof File) ||
        value.size === 0 ||
        value.size > MAX_DOCUMENT_SIZE
    ) {
        return NextResponse.json(
        { error: "Invalid supporting document." },
        { status: 400 }
        );
    }

    seenCategories.add(category);
    documents.push({ category, file: value });
    }

    if (
    requiredDocumentCategories.some(
        (category) => !seenCategories.has(category)
    )
    ) {
    return NextResponse.json(
        { error: "Required supporting documents are missing." },
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

const normalizeSignatureName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const expectedSignature = [
  form.firstName,
  form.middleName,
  form.lastName,
]
  .filter((part) => part.trim())
  .join(" ");

if (
  typeof body.signature !== "string" ||
  normalizeSignatureName(body.signature) !==
    normalizeSignatureName(expectedSignature)
) {
  return NextResponse.json(
    {
      error:
        "Electronic signature must match the applicant's full name.",
    },
    { status: 400 }
  );
}

const required = [
  "firstName",
  "lastName",
  "phone",
];

const employed = [
    "Full Time", "Part Time", "Casual",
    "Self Employed", "Contract",
].includes(form.employment);

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

const needsPreviousEmployer =
  ["Part Time", "Casual"].includes(form.employment) &&
  form.monthsInRole !== "" &&
  Number.isFinite(Number(form.monthsInRole)) &&
  Number(form.monthsInRole) < 3;

if (form.previousEmployer.startsWith("EMPLOYED:")) {
  form.previousEmployer = form.previousEmployer.slice(9).trim();
}

const allowedRentFrequencies = [
  "Weekly",
  "Fortnightly",
  "Monthly",
];

if (
  form.rentFrequency &&
  !allowedRentFrequencies.includes(form.rentFrequency)
) {
  return NextResponse.json(
    { error: "Invalid rent payment frequency." },
    { status: 400 }
  );
}

if (!form.rent) {
  form.rentFrequency = "";
}


const allowedIncomeFrequencies = [
  "Weekly",
  "Fortnightly",
  "Monthly",
];

if (
  form.incomeFrequency &&
  !allowedIncomeFrequencies.includes(form.incomeFrequency)
) {
  return NextResponse.json(
    { error: "Invalid income frequency." },
    { status: 400 }
  );
}

if (!form.income) {
  form.incomeFrequency = "";
}

if (
  form.hasTradeIn &&
  !["Yes", "No"].includes(form.hasTradeIn)
) {
  return NextResponse.json(
    { error: "Invalid trade-in selection." },
    { status: 400 }
  );
}

if (
  form.hasDeposit &&
  !["Yes", "No"].includes(form.hasDeposit)
) {
  return NextResponse.json(
    { error: "Invalid deposit selection." },
    { status: 400 }
  );
}

// Only keep deposit amounts when the customer selected Yes.
if (form.hasDeposit !== "Yes") {
  form.deposit = "";
}

const moneyFields = [
    "rent", "income", "otherIncome",
    "food", "utilities", "communication",
    "transport", "insurance", "clothing",
    "medical", "childcare", "recreation",
    "otherExpenses", "loanAmount",
    "weeklyBudget", "deposit", 
];

for (const key of moneyFields) {
  const value = form[key];

  // Empty optional fields are allowed.
  if (!value) continue;

  if (readMoney(value) === null) {
    return NextResponse.json(
      { error: `Invalid financial amount: ${key}` },
      { status: 400 }
    );
  }
}

if (form.residency === "Visa Holder") {
    if (
        form.visaSubclass &&
        !/^\d{3,4}$/.test(form.visaSubclass)
        ) {
            return NextResponse.json(
                { error: "Please enter a valid visa subclass number." },
                { status: 400 }
            );
        }
} else {
  form.visaSubclass = "";
}

const amount = readMoney(form.loanAmount);
const income = readMoney(form.income);

const monthlyIncome =
  income === null
    ? null
    : income *
      (form.incomeFrequency === "Weekly"
        ? 52 / 12
        : form.incomeFrequency === "Fortnightly"
          ? 26 / 12
          : 1);

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

const assets: ReturnType<typeof parseEntries> = [];

if (form.hasLoans && !["Yes", "No"].includes(form.hasLoans)) {
  return NextResponse.json(
    { error: "Invalid existing loans selection." },
    { status: 400 }
  );
}

const liabilities =
  form.hasLoans === "Yes"
    ? parseEntries(body.liabilities).filter(
        (loan) =>
          loan.type.trim() !== "" ||
          loan.description.trim() !== "" ||
          loan.amount.trim() !== "" ||
          loan.monthlyRepayment.trim() !== ""
      )
    : [];

if (!employed) {
  for (const key of [
    "employer",
    "employerPhone",
    "jobTitle",
    "monthsInRole",
    "previousEmployer",
  ]) {
    form[key] = "";
  }
} else if (
  !["Part Time", "Casual"].includes(form.employment) ||
  Number(form.monthsInRole) >= 3
) {
  form.previousEmployer = "";
}

if (form.employment === "Centrelink") {
  form.otherIncome = "";
  form.otherIncomeSource = "";
} else if (Number(form.otherIncome) <= 0) {
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

const savedDocuments = [];

for (const document of documents) {
  const saved = await saveFinanceDocument(document.file);

  storedKeys.push(saved.storageKey);

  savedDocuments.push({
    category: document.category,
    originalName: saved.originalName,
    storageKey: saved.storageKey,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
  });
}

const application = await prisma.financeApplication.create({
    data: {
        tokenHash,
        customerName: fullName,
        phone: form.phone,
        email: form.email,
        status: "SUBMITTED",
        employmentType: form.employment,
        employer: form.employer || null,
        monthlyIncome:
        monthlyIncome === null
            ? null
            : new Prisma.Decimal(monthlyIncome.toFixed(2)),

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

        loanAmount:
            amount === null ? null : new Prisma.Decimal(amount),
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

            documents: {
            create: savedDocuments,
        },
    },
});

return NextResponse.json(
  {
    success: true,
    applicationId: application.id,
    inquiryNumber: application.inquiryNumber,
    displayReference: formatInquiryNumber(application.inquiryNumber),
  },
  { status: 201 }
);


} catch (error) {
  // Delete uploaded files if application submission fails.
  await Promise.allSettled(
    storedKeys.map((key) =>
      unlink(
        path.join(
          process.cwd(),
          "private-uploads",
          key
        )
      )
    )
  );

  // Handle invalid assets or liabilities.
  if (
    error instanceof Error &&
    (
      error.message === "Invalid assets or liabilities." ||
      error.message === "Invalid entry."
    )
  ) {
    return NextResponse.json(
      { error: "Invalid assets or liabilities." },
      { status: 400 }
    );
  }

  // Handle invalid uploaded documents.
  if (
    error instanceof Error &&
    (
      error.message === "Invalid document type or size." ||
      error.message === "Document content does not match its file type."
    )
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  console.error("Finance application error:", error);

  return NextResponse.json(
    { error: "Unable to save the test application." },
    { status: 500 }
  );
}
}

