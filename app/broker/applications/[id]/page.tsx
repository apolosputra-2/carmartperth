
import Link from "next/link";
import EditApplicationModal from "@/components/broker/EditApplicationModal";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    ["Monthly Rent / Mortgage", "rent"],
    ["Landlord / Agent", "landlord"],
    ["Landlord Contact", "landlordPhone"],
    ["Previous Address", "previousAddress"],
    ["Time at Previous Address", "previousMonths"],
  ],
  employment: [
    ["Employment Status", "employment"],
    ["Net Monthly Income", "income"],
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
    ["Loan Amount", "loanAmount"],
    ["Weekly Payment Budget", "weeklyBudget"],
    ["Deposit / Trade-in", "deposit"],
    ["Vehicle", "vehicle"],
    ["Credit History", "creditHistory"],
    ["Additional Notes", "additionalNotes"],
  ],
} satisfies Record<string, [string, string][]>;

const currencyKeys = new Set([
  "rent", "income", "otherIncome", "food",
  "utilities", "communication", "transport",
  "insurance", "clothing", "medical",
  "childcare", "recreation", "otherExpenses",
  "loanAmount", "weeklyBudget", "deposit",
]);

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
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="mt-1 text-sm text-white">
                    {item.description || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {liability ? "Balance Owing" : "Value"}
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
  // Development only: no production access until
  // staff authentication and authorisation are added.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { id } = await params;

  const application = await prisma.financeApplication.findUnique({
    where: { id },
  });

  if (!application || application.status === "LINK_SENT") {
    notFound();
  }

  const saved = (application.formData ?? {}) as SavedApplication;
  const form = saved.fields ?? {};
  const assets = Array.isArray(saved.assets) ? saved.assets : [];
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
              <FieldGrid fields={sections.applicant} data={form} />
            </Panel>

            <Panel title="Address & Living" icon={MapPin}>
              <FieldGrid fields={sections.address} data={form} />
            </Panel>

            <Panel title="Employment & Income" icon={BriefcaseBusiness}>
              <FieldGrid fields={sections.employment} data={form} />
            </Panel>

            <Panel title="Financial Position" icon={Wallet}>
              <h3 className="mb-5 text-sm font-semibold">
                Monthly Living Expenses
              </h3>

              <FieldGrid fields={sections.expenses} data={form} />

              <div className="mt-6 border-t border-[#33343e] pt-3">
                <EntryList title="Assets" items={assets} />
                <EntryList
                  title="Liabilities"
                  items={liabilities}
                  liability
                />
              </div>
            </Panel>

            <Panel title="Loan Information" icon={CarFront}>
              <FieldGrid fields={sections.loan} data={form} />
            </Panel>

            <Panel title="Supporting Documents" icon={FileText}>
              <div className="rounded-lg border border-[#363740] bg-[#202127] p-4">
                <p className="text-sm text-gray-300">
                  Document storage is not connected yet.
                </p>
                <p className="mt-2 text-xs leading-6 text-gray-500">
                  The current form only previews selected documents
                  in the customer's browser. No document files were
                  saved with this application.
                </p>
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
              <p className="text-sm text-gray-400">
                No broker assigned yet.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Broker assignment will be enabled after we add
                staff accounts and database relationships.
              </p>
            </Panel>

            <Panel title="Update Status" icon={ClipboardList}>
              <select
                disabled
                defaultValue=""
                className="w-full rounded-lg border border-[#34343e] bg-[#0b0c11] p-3 text-sm text-gray-400"
              >
                <option value="">Choose new status...</option>
                <option>Submitted</option>
                <option>Under Review</option>
                <option>Approved</option>
                <option>Declined</option>
              </select>

              <textarea
                disabled
                rows={3}
                placeholder="Optional status note"
                className="mt-3 w-full rounded-lg border border-[#34343e] bg-[#0b0c11] p-3 text-sm"
              />

              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg bg-[#30313a] py-3 text-sm font-semibold text-gray-500"
              >
                Update Status — Coming Soon
              </button>
            </Panel>

            <Panel title="Broker Notes" icon={FileText}>
              <textarea
                disabled
                rows={4}
                placeholder="Add a note to this application..."
                className="w-full rounded-lg border border-[#34343e] bg-[#0b0c11] p-3 text-sm"
              />

              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg bg-[#30313a] py-3 text-sm font-semibold text-gray-500"
              >
                Save Note — Coming Soon
              </button>
            </Panel>

            <Panel title="Status History" icon={History}>
              <div className="space-y-3">
                <div className="border-l-2 border-cyan-500 pl-4">
                  <p className="text-sm font-semibold text-white">
                    Application Submitted
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {perthDate(application.submittedAt)}
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Further status changes will appear here once
                  audit logging is implemented.
                </p>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}
