
import Link from "next/link";
import FinanceStatusControl from "@/components/broker/FinanceStatusControl";
import EditApplicationModal from "@/components/broker/EditApplicationModal";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import BrokerAssignmentDropdown from "@/components/broker/BrokerAssignmentDropdown";
import {
  ArrowLeft,
  UserRound,
  MapPin,
  BriefcaseBusiness,
  Wallet,
  CarFront,
  FileText,
  ShieldCheck,
  Clock3,
  Users,
  History,
  ClipboardList,
} from "lucide-react";

const applicationStatusColors: Record<string, string> = {
  SUBMITTED: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  RECEIVED: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  SENT_TO_BROKER: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  UNDER_REVIEW: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  ADDITIONAL_INFO_REQUIRED: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  SENT_TO_LENDER: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  CONDITIONALLY_APPROVED: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  APPROVED: "border-green-500/40 bg-green-500/10 text-green-400",
  DECLINED: "border-red-500/40 bg-red-500/10 text-red-400",
  SETTLED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

export const dynamic = "force-dynamic";

type Entry = {
  type?: string;
  description?: string;
  amount?: string;
  monthlyRepayment?: string;
};

type SavedApplication = {
  fields?: Record<string, string>;
  assets?: Entry[];
  liabilities?: Entry[];
  signature?: string;
  smsConsent?: boolean;
  metaConsent?: boolean;
};

const sections = {
  applicant: [
        ["Full Name", "firstName"],
        ["Middle Name", "middleName"],
        ["Last Name", "lastName"],
        ["Date of Birth", "dob"],
        ["Residency", "residency"],
        ["Visa Subclass", "visaSubclass"],
        ["Marital Status", "marital"],
        ["Driver's Licence Number", "licence"],
        ["Licence State", "licenceState"],
        ["Email", "email"],
        ["Phone", "phone"],
    ],
    address: [
        ["Street Address", "street"],
        ["Suburb", "suburb"],
        ["State", "state"],
        ["Postcode", "postcode"],
        ["Time at Address (months)", "monthsAtAddress"],
        ["Living Situation", "livingSituation"],
        ["Rent / Mortgage Amount", "rent"],
        ["Landlord / Agent", "landlord"],
        ["Landlord Contact", "landlordPhone"],
        ["Previous Address", "previousAddress"],
        ["Time at Previous Address", "previousMonths"],
    ],
    employment: [
        ["Employment Status", "employment"],
        ["Net Income", "income"],
        ["Employer", "employer"],
        ["Employer Phone", "employerPhone"],
        ["Job Title", "jobTitle"],
        ["Time in Role (months)", "monthsInRole"],
        ["Previous Employer", "previousEmployer"],
        ["Other Monthly Income", "otherIncome"],
        ["Other Income Source", "otherIncomeSource"],
    ],
    expenses: [
        ["Food & Groceries", "food"],
        ["Utilities & Property", "utilities"],
        ["Communication", "communication"],
        ["Transport", "transport"],
        ["Insurance", "insurance"],
        ["Clothing & Personal Care", "clothing"],
        ["Medical & Fitness", "medical"],
        ["Childcare", "childcare"],
        ["Recreation & Entertainment", "recreation"],
        ["Other Expenses", "otherExpenses"],
        ["Dependants", "dependants"],
    ],
    loan: [
    ["Vehicle", "vehicle"],
    ["Loan Amount", "loanAmount"],
    ["Weekly Payment Budget", "weeklyBudget"],
    ["Vehicle Trade-in", "hasTradeIn"],
    ["Deposit", "hasDeposit"],
    ["Deposit Amount", "deposit"],
    ["Credit History", "creditHistory"],
    ],
} satisfies Record<string, [string, string][]>;

const currencyKeys = new Set([
  "rent", "income", "otherIncome", "food",
  "utilities", "communication", "transport",
  "insurance", "clothing", "medical",
  "childcare", "recreation", "otherExpenses",
  "loanAmount", "weeklyBudget", "deposit",
]);

function displayAmountWithFrequency(
  amount: string | undefined,
  frequency: string | undefined,
  legacyLabel = "Monthly"
) {
  if (!amount?.trim()) return "Not provided";

  const number = Number(amount);

  if (!Number.isFinite(number)) return "Not provided";

  const formatted = number.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });

  return `${formatted} ${frequency || legacyLabel}`;
}

function displayPreviousEmployment(value?: string) {
  if (!value?.trim()) return "Not provided";

  if (value.startsWith("EMPLOYED:")) {
    const employer = value.slice("EMPLOYED:".length).trim();

    return employer
      ? `Previously Employed — ${employer}`
      : "Previously Employed";
  }

  if (value === "Unemployed") {
    return "Previously Unemployed";
  }

  if (value === "Centrelink") {
    return "Previously Unemployed — Receiving Centrelink";
  }

  // Legacy applications may contain an employer name directly.
  return `Previously Employed — ${value}`;
}

function displayValue(key: string, value?: string) {
  if (!value?.trim()) return "Not provided";

  if (currencyKeys.has(key)) {
    const amount = Number(value);

    if (Number.isFinite(amount)) {
      return amount.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
      });
    }
  }

  return value;
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#33343e] bg-[#15161c] p-5">
      <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
        <Icon size={17} className="text-cyan-400" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldGrid({
  fields,
  data,
}: {
  fields: [string, string][];
  data: Record<string, string>;
}) {
  return (
    <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, key]) => (
        <div key={key} className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            {label}
          </p>
          <p className="break-words whitespace-pre-wrap text-sm font-medium text-gray-200">
            {displayValue(key, data[key])}
          </p>
        </div>
      ))}
    </div>
  );
}

function EntryList({
  title,
  items,
  liability = false,
}: {
  title: string;
  items: Entry[];
  liability?: boolean;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-200">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          None recorded
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-[#353640] bg-[#202127] p-4"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="mt-1 text-sm text-white">
                    {item.type || "—"}
                  </p>
                </div>

                <div>
                    <p className="text-xs text-gray-500">
                        {liability ? "Lender Name" : "Description"}
                    </p>
                    <p className="mt-1 text-sm text-white">
                        {item.description || "—"}
                    </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {liability ? "Outstanding Balance" : "Value"}
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {displayValue("loanAmount", item.amount)}
                  </p>
                </div>

                {liability && (
                  <div>
                    <p className="text-xs text-gray-500">
                      Monthly Repayment
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {displayValue(
                        "loanAmount",
                        item.monthlyRepayment
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

function perthDate(value: Date | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    
    const user = await getPortalUser();

    if (!user) {
    notFound();
    }

    const { id } = await params;

    const application = await prisma.financeApplication.findFirst({
        where: {
            id,
            submittedAt: {
            not: null,
            },
            ...(user.role === "BROKER"
            ? { assignedBrokerId: user.id }
            : {}),
        },

    include: {
        assignedBroker: {
            select: {
            name: true,
            email: true,
            phone: true,
            },
        },
        documents: {
            orderBy: {
            uploadedAt: "desc",
            },
            select: {
            id: true,
            category: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
            },
        },
        },
    });

    if (!application || application.status === "LINK_SENT") {
        notFound();
    }

    

    const [brokerHistory, staffHistory, statusHistory] =
    await Promise.all([
        prisma.brokerAssignmentHistory.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
        }),

        prisma.staffAssignmentHistory.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
        }),

        prisma.financeStatusHistory.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
        }),
    ]);

    const userIds = [
    ...new Set([
        ...brokerHistory.flatMap((entry) => [
        entry.assignedById,
        entry.brokerId,
        ...(entry.previousBrokerId
            ? [entry.previousBrokerId]
            : []),
        ]),
        ...staffHistory.flatMap((entry) => [
        entry.assignedById,
        entry.staffId,
        ...(entry.previousStaffId
            ? [entry.previousStaffId]
            : []),
        ]),
        ...statusHistory.map((entry) => entry.changedById),
        ]),
    ];

    const historyUsers = await prisma.portalUser.findMany({
    where: {
        id: { in: userIds },
    },
    select: {
        id: true,
        name: true,
    },
    });

    const userNames = new Map(
    historyUsers.map((user) => [user.id, user.name])
    );

    const brokerEvents = brokerHistory.map((entry) => ({
    id: `broker-${entry.id}`,
    title: entry.previousBrokerId
        ? "Broker Reassigned"
        : "Broker Assigned",
    description: entry.previousBrokerId
        ? `${userNames.get(entry.assignedById) ?? "Unknown user"} reassigned the broker from ${userNames.get(entry.previousBrokerId) ?? "Unknown broker"} to ${userNames.get(entry.brokerId) ?? "Unknown broker"}.`
        : `${userNames.get(entry.assignedById) ?? "Unknown user"} assigned the application to ${userNames.get(entry.brokerId) ?? "Unknown broker"}.`,
    timestamp: entry.createdAt,
    color: "border-cyan-500",
    note: null as string | null,
    }));

    const staffEvents = staffHistory.map((entry) => ({
    id: `staff-${entry.id}`,
    title: entry.previousStaffId
        ? "Staff Reassigned"
        : entry.assignedById === entry.staffId
        ? "Staff Assignment Claimed"
        : "Staff Assigned",
    description: entry.previousStaffId
        ? `${userNames.get(entry.assignedById) ?? "Unknown user"} reassigned staff responsibility from ${userNames.get(entry.previousStaffId) ?? "Unknown staff"} to ${userNames.get(entry.staffId) ?? "Unknown staff"}.`
        : entry.assignedById === entry.staffId
        ? `${userNames.get(entry.staffId) ?? "Unknown staff"} claimed responsibility for this application.`
        : `${userNames.get(entry.assignedById) ?? "Unknown user"} assigned responsibility to ${userNames.get(entry.staffId) ?? "Unknown staff"}.`,
    timestamp: entry.createdAt,
    color: "border-amber-500",
    note: null as string | null,
    }));

    const statusEvents = statusHistory.map((entry) => {
        const isNoteOnly =
            entry.previousStatus === entry.newStatus;

        return {
            id: `status-${entry.id}`,
            title: isNoteOnly
                ? "Broker Note Added"
                : "Finance Status Changed",
            description: isNoteOnly
                ? `${userNames.get(entry.changedById) ?? "Unknown broker"} added a note under ${formatStatusLabel(entry.newStatus)}.`
                : `${userNames.get(entry.changedById) ?? "Unknown broker"} changed the status from ${formatStatusLabel(entry.previousStatus)} to ${formatStatusLabel(entry.newStatus)}.`,
            note: entry.note,
            timestamp: entry.createdAt,
            color: isNoteOnly
                ? "border-amber-500"
                : "border-violet-500",
        };
    });

    const historyEvents = [
    ...brokerEvents,
    ...staffEvents,
    ...statusEvents,
    ...(application.submittedAt
        ? [{
            id: "submitted",
            title: "Application Submitted",
            description:
            "Customer submitted the finance application.",
            timestamp: application.submittedAt,
            color: "border-emerald-500",
            note: null as string | null,
        }]
        : []),
    ].sort(
    (a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
    );

    const saved = (application.formData ?? {}) as SavedApplication;
    const form = saved.fields ?? {};
    const liabilities = Array.isArray(saved.liabilities)
        ? saved.liabilities
        : [];

    const employment = application.employmentType ?? form.employment ?? "";

    const employed = [
        "Full Time",
        "Part Time",
        "Casual",
        "Self Employed",
        "Contract",
    ].includes(employment);

    const unemployed = ["Unemployed", "Centrelink"].includes(employment);

    const fullName =
        application.customerName || "Unknown Applicant";

    return (
        <main className="min-h-screen bg-[#0b0c11] p-5 text-white lg:p-8">
        <div className="mx-auto max-w-[1500px] space-y-6">
            {/* Header */}
            <div>
            <Link
                href="/broker"
                className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400"
            >
                <ArrowLeft size={17} />
                Back to Broker Portal
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                    Finance Application
                </p>

                <h1 className="text-3xl font-bold">
                    {fullName}
                </h1>

                <p className="mt-2 break-all font-mono text-xs text-gray-500">
                    Application ID: {application.id}
                </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <EditApplicationModal
                        key={application.updatedAt.toISOString()}
                        applicationId={application.id}
                        customerName={fullName}
                        initialFields={form}
                        initialLiabilities={liabilities}
                    />
                {(employed || unemployed) && (
                    <span
                        className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-xs font-bold ${                    employed
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    }`}
                    >
                    {employed ? "EMPLOYED" : "UNEMPLOYED"}
                    </span>
                )}


                    <span
                    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-xs font-bold ${
                        applicationStatusColors[application.status] ??
                        "border-slate-500/40 bg-slate-500/10 text-slate-300"
                    }`}
                    >
                    {application.status.replaceAll("_", " ")}
                </span>
                </div>
            </div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
            {/* Left side */}
            <div className="min-w-0 space-y-5">
                <Panel title="Application Progress" icon={Clock3}>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <p className="mt-2 text-sm font-semibold text-cyan-400">
                        {application.status.replaceAll("_", " ")}
                    </p>
                    </div>
                    <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="mt-2 text-sm text-white">
                        {perthDate(application.submittedAt)}
                    </p>
                    </div>
                    <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="mt-2 text-sm text-white">
                        {perthDate(application.updatedAt)}
                    </p>
                    </div>
                </div>
                </Panel>

                <Panel title="Applicant" icon={UserRound}>
                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <div>
                    <p className="text-xs text-gray-500">Application Type</p>
                    <p className="mt-1 text-sm text-white">
                        {application.applicationType || "Private"}
                    </p>
                    </div>
                    <div>
                    <p className="text-xs text-gray-500">Applicants</p>
                    <p className="mt-1 text-sm text-white">
                        {application.applicantType || "Single"}
                    </p>
                    </div>
                    <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="mt-1 text-sm text-white">
                        {fullName}
                    </p>
                    </div>
                </div>          
                <FieldGrid
                fields={sections.applicant.filter(
                    ([, key]) =>
                    key !== "visaSubclass" ||
                    form.residency === "Visa Holder"
                )}
                data={form}
                />
                </Panel>

                <Panel title="Address & Living" icon={MapPin}>
                    <FieldGrid
                        fields={sections.address.filter(
                        ([, key]) =>
                            key !== "rent" &&
                            (
                            !["previousAddress", "previousMonths"].includes(key) ||
                            Boolean(form[key]?.trim())
                            )
                        )}
                        data={form}
                    />

                    <div className="mt-5 border-t border-[#33343e] pt-5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                        Rent / Mortgage
                        </p>
                        <p className="text-sm font-medium text-gray-200">
                        {displayAmountWithFrequency(
                            form.rent,
                            form.rentFrequency
                        )}
                        </p>
                    </div>
                </Panel>

                <Panel title="Employment & Income" icon={BriefcaseBusiness}>
                    <FieldGrid
                    fields={sections.employment.filter(
                        ([, key]) =>
                        key !== "income" &&
                        key !== "previousEmployer"
                    )}
                    data={form}
                    />

                    {Boolean(form.previousEmployer?.trim()) && (
                    <div className="mt-5 border-t border-[#33343e] pt-5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                        Previous Employment Status
                        </p>
                        <p className="text-sm font-medium text-gray-200">
                        {displayPreviousEmployment(form.previousEmployer)}
                        </p>
                    </div>
                    )}

                    <div className="mt-5 border-t border-[#33343e] pt-5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                        Net Income (After Tax)
                        </p>
                        <p className="text-sm font-medium text-gray-200">
                        {displayAmountWithFrequency(
                            form.income,
                            form.incomeFrequency
                        )}
                        </p>
                    </div>
                </Panel>


                <Panel title="Expenses" icon={Wallet}>
                <h3 className="mb-5 text-sm font-semibold">
                    Monthly Living Expenses
                </h3>

                <FieldGrid fields={sections.expenses} data={form} />

                <div className="mt-6 border-t border-[#33343e] pt-5">
                    <div className="mb-5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                            Do You Have Any Existing Loans?
                        </p>
                        <p className="text-sm font-medium text-gray-200"> 
                            {form.hasLoans === "Yes" || form.hasLoans === "No"
                            ? form.hasLoans
                            : liabilities.length > 0
                                ? "Yes (based on recorded loans)"
                                : "Not specified"}
                        </p>
                    </div>

                    {liabilities.length > 0 && (
                        <EntryList
                            title="Existing Loans"
                            items={liabilities}
                            liability
                        />
                        )}
                    </div>
                </Panel>

                <Panel title="Loan Information" icon={CarFront}>
                    <FieldGrid
                        fields={sections.loan.filter(([, key]) => {
                        if (key === "deposit") {
                            return (
                            form.hasDeposit === "Yes" ||
                            (!form.hasDeposit && Boolean(form.deposit?.trim()))
                            );
                        }

                        return true;
                        })}
                        data={form}
                    />
                </Panel>

                <Panel title="Supporting Documents" icon={FileText}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Documents submitted by the applicant
                    </p>

                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        {application.documents.length} files
                    </span>
                    </div>

                    {application.documents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#363740] bg-[#202127] p-5">
                        <p className="text-sm text-gray-400">
                        No supporting documents uploaded.
                        </p>
                    </div>
                    ) : (
                    <div className="space-y-3">
                        {application.documents.map((document) => {
                        const categoryNames: Record<string, string> = {
                            // New document categories
                            licenceFront: "Driver's Licence — Front",
                            licenceBack: "Driver's Licence — Back",
                            medicareFront: "Medicare Card — Front",
                            medicareBack: "Medicare Card — Back",
                            payslip1: "Recent Payslip / Income Statement 1",
                            payslip2: "Recent Payslip / Income Statement 2",

                            // Legacy categories
                            photoId: "Driver's Licence / Photo ID",
                            payslip: "Recent Payslip",
                            medicare: "Medicare Card",
                            rates: "Proof of Address",
                            otherDocument: "Other Supporting Document",
                        };


                        return (
                            <div
                            key={document.id}
                            className="flex flex-wrap items-center gap-3 rounded-lg border border-[#353640] bg-[#202127] p-4"
                            >
                            <div className="rounded-lg bg-[#30313a] p-3">
                                <FileText
                                size={20}
                                className="text-cyan-400"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-semibold text-white">
                                {categoryNames[document.category] ??
                                    document.category}
                                </p>

                                <p className="mt-1 break-all text-xs text-gray-400">
                                {document.originalName}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB
                                {" · "}
                                {perthDate(document.uploadedAt)}
                                </p>
                            </div>

                            <a
                                href={`/api/broker/applications/${application.id}/documents/${document.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20"
                            >
                                View File
                            </a>
                            </div>
                        );
                        })}
                    </div>
                    )}
                </div>
                </Panel>

                <Panel title="Privacy & Consent" icon={ShieldCheck}>
                <div className="space-y-4 text-sm">
                    <div>
                    <p className="text-xs text-gray-500">
                        Consent Recorded
                    </p>
                    <p className="mt-1 text-white">
                        {perthDate(application.consentRecordedAt)}
                    </p>
                    </div>

                    <div>
                    <p className="text-xs text-gray-500">
                        Electronic Signature (test entry)
                    </p>
                    <p className="mt-1 text-white">
                        {saved.signature || "Not recorded"}
                    </p>
                    </div>

                    <div>
                    <p className="text-xs text-gray-500">
                        SMS Updates Consent
                    </p>
                    <p className="mt-1 text-white">
                        {saved.smsConsent ? "Yes" : "No"}
                    </p>
                    </div>

                    <div>
                    <p className="text-xs text-gray-500">
                        Optional Meta Consent
                    </p>
                    <p className="mt-1 text-white">
                        {saved.metaConsent ? "Yes" : "No"}
                    </p>
                    </div>

                    <p className="border-t border-[#33343e] pt-4 text-xs leading-6 text-gray-500">
                    These values come from local test submissions.
                    Production consent auditing and document-version
                    records still need implementation.
                    </p>
                </div>
                </Panel>
            </div>

            {/* Right side */}
            <aside className="space-y-5">

            <Panel title="Assigned Broker" icon={Users}>
                <div className="space-y-4">
                    {application.assignedBroker ? (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-white">
                        {application.assignedBroker.name}
                        </p>

                        <p className="text-xs text-gray-400">
                        {application.assignedBroker.email || "No email"}
                        </p>

                        <p className="text-xs text-gray-400">
                        {application.assignedBroker.phone || "No phone"}
                        </p>
                    </div>
                    ) : (
                    <p className="text-sm text-gray-400">
                        No broker assigned yet.
                    </p>
                    )}

                    {(user.role === "STAFF" || user.role === "BOSS") && (
                    <div className="border-t border-[#33343e] pt-4">
                        <BrokerAssignmentDropdown
                        applicationId={application.id}
                        currentBrokerId={application.assignedBrokerId}
                        />
                    </div>
                    )}
                </div>
            </Panel>

            <Panel title="Update Status" icon={ClipboardList}>
                <FinanceStatusControl
                    key={`${application.status}-${application.assignedBrokerId ?? "none"}`}
                    applicationId={application.id}
                    currentStatus={application.status}
                    canEdit={
                    user.role === "BROKER" &&
                    application.assignedBrokerId === user.id
                    }
                />
                </Panel>

                <Panel title="Status History" icon={History}>
                <div className="space-y-5">
                    {historyEvents.map((event) => (
                    <div
                        key={event.id}
                        className={`border-l-2 pl-4 ${event.color}`}
                    >
                        <p className="text-sm font-semibold text-white">
                        {event.title}
                        </p>

                <p className="mt-2 text-xs leading-5 text-gray-300">
                {event.description
                    .split(
                    new RegExp(
                        `(${[
                        ...userNames.values(),
                        ...statusHistory.flatMap((entry) => [
                            formatStatusLabel(entry.previousStatus),
                            formatStatusLabel(entry.newStatus),
                        ]),
                        ]
                        .filter(Boolean)
                        .map((value) =>
                            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                        )
                        .sort((a, b) => b.length - a.length)
                        .join("|")})`,
                        "g"
                    )
                    )
                    .map((part, index) => {
                    const boldValues = [
                        ...userNames.values(),
                        ...statusHistory.flatMap((entry) => [
                        formatStatusLabel(entry.previousStatus),
                        formatStatusLabel(entry.newStatus),
                        ]),
                    ];

                    return boldValues.includes(part) ? (
                        <strong key={index} className="font-bold text-white">
                        {part}
                        </strong>
                    ) : (
                        <span key={index}>{part}</span>
                    );
                    })}
                </p>

                        {event.note && (
                            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-400">
                                <FileText size={14} />
                                Broker Note
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-white">
                                {event.note}
                                </p>
                            </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                        {perthDate(event.timestamp)}
                        </p>
                    </div>
                    ))}

                    {historyEvents.length === 0 && (
                    <p className="text-xs text-gray-500">
                        No history recorded yet.
                    </p>
                    )}
                </div>
                </Panel>
            </aside>
            </div>
        </div>
    </main>
  );
}
