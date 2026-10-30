
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

const editableKeys = new Set([
    "firstName", "middleName", "lastName", "dob",
    "residency", "visaSubclass", "marital", "licence", "licenceState",
    "email", "phone", "street", "suburb", "state",
    "postcode", "monthsAtAddress", "livingSituation",
    "rent", "rentFrequency", "landlord", "landlordPhone",
    "employment", "employer", "employerPhone",
    "jobTitle", "monthsInRole", "previousEmployer",
    "income", "incomeFrequency", "otherIncome", "otherIncomeSource",
    "food", "utilities", "communication",
    "transport", "insurance", "clothing",
    "medical", "childcare", "recreation",
    "otherExpenses", "dependants", "hasLoans",
    "loanAmount", "weeklyBudget",
    "hasTradeIn", "hasDeposit", "deposit",
    "vehicle", "creditHistory",
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
        throw new Error("INVALID_FINANCIAL_AMOUNT");
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
                { error: "You do not have permission to edit applications." },
                { status: 403 }
            );
        }

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

    if (
    user.role === "BROKER" &&
    existing.assignedBrokerId !== user.id
    ) {
    return NextResponse.json(
        { error: "Application not found or access denied." },
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


    // Validate residency and visa subclass.
    const allowedResidencies = [
    "",
    "Citizen",
    "Australian Citizen",
    "Permanent Resident",
    "Visa Holder",
    ];

    if (!allowedResidencies.includes(updatedFields.residency ?? "")) {
      return NextResponse.json(
        { error: "Please select a valid residency status." },
        { status: 400 }
      );
    }

    if (updatedFields.residency === "Visa Holder") {
      const subclass = (updatedFields.visaSubclass ?? "").trim();

      if (!/^\d{3,4}$/.test(subclass)) {
        return NextResponse.json(
          { error: "Please enter a valid 3–4 digit visa subclass number." },
          { status: 400 }
        );
      }

      updatedFields.visaSubclass = subclass;
    } else {
      // Remove old subclass data when residency changes.
      updatedFields.visaSubclass = "";
    }


    if (
    !updatedFields.firstName ||
    !updatedFields.lastName ||
    !updatedFields.phone
    ) {
    return NextResponse.json(
        { error: "First name, last name and phone are required." },
        { status: 400 }
    );
    }


const employed = [
  "Full Time",
  "Part Time",
  "Casual",
  "Self Employed",
  "Contract",
].includes(updatedFields.employment);

    if (!employed) {
        for (const key of [
            "employer",
            "employerPhone",
            "jobTitle",
            "monthsInRole",
        ]) {
            updatedFields[key] = "";
        }
    }

    // Only clear previous employment when the applicant's
    // current employment details have been changed to a
    // situation where previous employment is not applicable.
    const employmentChanged =
    updatedFields.employment !== previousFields.employment;

    const monthsInRoleChanged =
    updatedFields.monthsInRole !== previousFields.monthsInRole;

    if (employmentChanged || monthsInRoleChanged) {
    const needsPreviousEmployment =
        ["Part Time", "Casual"].includes(updatedFields.employment) &&
        updatedFields.monthsInRole?.trim() !== "" &&
        Number(updatedFields.monthsInRole) < 3;

    if (!needsPreviousEmployment) {
        updatedFields.previousEmployer = "";
    }
    }

    if (Number(updatedFields.otherIncome) <= 0) {
        updatedFields.otherIncomeSource = "";
    }

    
    // Validate optional Yes/No answers.
    const yesNoFields = [
      "hasLoans",
      "hasTradeIn",
      "hasDeposit",
    ];

    for (const key of yesNoFields) {
      const value = updatedFields[key] ?? "";

      if (!["", "Yes", "No"].includes(value)) {
        return NextResponse.json(
          { error: `Invalid answer for ${key}.` },
          { status: 400 }
        );
      }
    }

    // Validate payment frequencies.
    const frequencyFields = [
      "rentFrequency",
      "incomeFrequency",
    ];

    for (const key of frequencyFields) {
      const value = updatedFields[key] ?? "";

      if (
        !["", "Weekly", "Fortnightly", "Monthly"].includes(value)
      ) {
        return NextResponse.json(
          { error: `Invalid payment frequency for ${key}.` },
          { status: 400 }
        );
      }
    }

    // A customer cannot have a deposit amount
    // when their deposit answer is explicitly No.
    if (updatedFields.hasDeposit === "No") {
      updatedFields.deposit = "";
    }

    // Validate deposit amount when provided.
    const deposit = updatedFields.deposit ?? "";

    if (deposit.trim() !== "") {
      const amount = Number(deposit);

      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json(
          {
            error:
              "Deposit amount must be a valid non-negative number.",
          },
          { status: 400 }
        );
      }
    }

    // Validate existing loan entries when the editor sends them.
    // If omitted, preserve any previously saved loans.
    const liabilitiesProvided =
      Object.prototype.hasOwnProperty.call(body, "liabilities");

    type LoanEntry = {
      type: string;
      description: string;
      amount: string;
      monthlyRepayment: string;
    };

    let updatedLiabilities: LoanEntry[] | undefined;

    if (liabilitiesProvided) {
      if (
        !Array.isArray(body.liabilities) ||
        body.liabilities.length > 20
      ) {
        return NextResponse.json(
          { error: "Invalid existing loans list (maximum 20)." },
          { status: 400 }
        );
      }

      const cleaned: LoanEntry[] = [];

      for (const item of body.liabilities) {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          return NextResponse.json(
            { error: "Invalid existing loan entry." },
            { status: 400 }
          );
        }

        const loan: LoanEntry = {
          type: "",
          description: "",
          amount: "",
          monthlyRepayment: "",
        };

        for (const key of [
          "type",
          "description",
          "amount",
          "monthlyRepayment",
        ] as const) {
          const value = item[key] ?? "";

          if (
            typeof value !== "string" ||
            value.length > 200
          ) {
            return NextResponse.json(
              { error: `Invalid loan field: ${key}.` },
              { status: 400 }
            );
          }

          loan[key] = value.trim();
        }

        for (const key of [
          "amount",
          "monthlyRepayment",
        ] as const) {
          const value = loan[key];

          if (
            value !== "" &&
            (!Number.isFinite(Number(value)) ||
              Number(value) < 0)
          ) {
            return NextResponse.json(
              {
                error:
                  "Loan balances and repayments must be valid non-negative numbers.",
              },
              { status: 400 }
            );
          }
        }

        // Ignore completely empty loan entries.
        if (Object.values(loan).some(Boolean)) {
          cleaned.push(loan);
        }
      }

            updatedLiabilities = cleaned;
        }
        // Prevent a No answer when existing loan details remain.
        const savedLiabilities = Array.isArray(original.liabilities)
        ? original.liabilities
        : [];

        const effectiveLiabilities =
        updatedLiabilities ?? savedLiabilities;

        if (
        updatedFields.hasLoans === "No" &&
        effectiveLiabilities.length > 0
        ) {
        return NextResponse.json(
            {
            error:
                "Existing Loans is set to No, but loan details are still recorded. Remove the loans first or select Yes.",
            },
            { status: 400 }
        );
    }

    const changes = Object.keys(updatedFields)
      .filter((key) => updatedFields[key] !== previousFields[key])
      .map((key) => ({
            field: key,
            // Don't write raw personal information into the audit trail.
            changed: true,
      }));

    const income = decimalOrNull(updatedFields.income || "");

    const incomeFrequency = updatedFields.incomeFrequency || "Monthly";

    if (
    !["Weekly", "Fortnightly", "Monthly"].includes(incomeFrequency)
    ) {
    return NextResponse.json(
        { error: "Invalid income frequency." },
        { status: 400 }
    );
    }

    const monthlyIncome = income
    ? income
        .mul(
            incomeFrequency === "Weekly"
            ? 52
            : incomeFrequency === "Fortnightly"
            ? 26
            : 1
        )
        .div(
            incomeFrequency === "Monthly" ? 1 : 12
        )
        .toDecimalPlaces(2)
    : null;

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

    
    const previousLiabilities = Array.isArray(original.liabilities)
      ? original.liabilities
      : [];

    const liabilitiesChanged =
      updatedLiabilities !== undefined &&
      JSON.stringify(updatedLiabilities) !==
        JSON.stringify(previousLiabilities);

    const auditEntry = {
        event: "APPLICATION_EDIT",
        editorId: user.id,
        editorName: user.name,
        editorRole: user.role,
        authorityConfirmed: true,
        timestamp: new Date().toISOString(),
        changedFields: [
            ...changes.map((item) => item.field),
            ...(liabilitiesChanged ? ["liabilities"] : []),
        ],
    };

    const previousHistory = Array.isArray(original.editHistory)
      ? original.editHistory
      : [];


    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.financeApplication.updateMany({
    where: {
        id,
        submittedAt: { not: null },
        updatedAt: existing.updatedAt,
        deletionInProgress: false,
        ...(user.role === "BROKER"
        ? { assignedBrokerId: user.id }
        : {}),
    },
    data: {
        customerName: fullName,
        email: updatedFields.email,
        phone: updatedFields.phone,
        employmentType: updatedFields.employment || null,
        employer: updatedFields.employer || null,
        monthlyIncome,
        monthlyExpenses: totalExpenses,
        loanAmount,
        address: [
        updatedFields.street,
        updatedFields.suburb,
        updatedFields.state,
        updatedFields.postcode,
        ]
        .filter(Boolean)
        .join(", "),
        formData: {
            ...original,
            fields: updatedFields,
            ...(updatedLiabilities !== undefined
                ? { liabilities: updatedLiabilities }
                : {}),
            editHistory: [...previousHistory, auditEntry],
        } as Prisma.InputJsonObject,
    },
    });

    if (updateResult.count !== 1) {
      return { updated: false };
    }

    await tx.applicationEditAuditLog.create({
      data: {
        applicationId: id,
        editorId: user.id,
        editorRole: user.role,
        changedFields: auditEntry.changedFields,
        authorityConfirmed: true,
      },
    });

    return { updated: true };
  });

  if (!result.updated) {
    return NextResponse.json(
      {
        error:
          "Application changed while you were editing. Refresh and try again.",
      },
      { status: 409 }
    );
  }

    return NextResponse.json({
      success: true,
      changedFields: changes.length,
    });
  } catch (error) {
    if (
        error instanceof Error &&
        error.message === "INVALID_FINANCIAL_AMOUNT"
        ) {
        return NextResponse.json(
            { error: "Financial amounts must be valid non-negative numbers." },
            { status: 400 }
        );
    }
    logServerError({
        operation: "broker-application-edit",
        error,
    });

    return NextResponse.json(
      { error: "Could not save application changes." },
      { status: 500 }
    );
  }
}
