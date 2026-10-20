
"use client";

import { useEffect, useState } from "react";

import {
  UserRound,
  House,
  BriefcaseBusiness,
  Wallet,
  CarFront,
  FileUp,
  ClipboardCheck,
  Plus,
  Trash2,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";

type FieldDefinition = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
};


type Entry = {
  id: number;
  type: string;
  description: string;
  amount: string;
  monthlyRepayment: string;
};


const states = ["WA", "NSW", "VIC", "QLD", "SA", "TAS", "ACT", "NT"];

const sections = [
  { title: "About You", icon: UserRound, subtitle: "Personal and identity details, exactly as they appear on your licence." },
  { title: "Where You Live", icon: House, subtitle: "Current address and living situation." },
  { title: "Work & Income", icon: BriefcaseBusiness, subtitle: "Your employment and income — every situation is welcome." },
  { title: "Financial Position", icon: Wallet, subtitle: "Monthly expenses, dependants, plus what you own and owe." },
  { title: "Your Loan", icon: CarFront, subtitle: "What you're borrowing and the car you have in mind." },
  { title: "Supporting Documents", icon: FileUp, subtitle: "Upload photos or PDFs (max 15 MB each)." },
  { title: "Review & Submit", icon: ClipboardCheck, subtitle: "Read the privacy and consent documents before submitting." },
];

const personalFields: FieldDefinition[] = [
  { key: "firstName", label: "First / Company Name", required: true },
  { key: "middleName", label: "Middle Name" },
  { key: "lastName", label: "Last Name", required: true },
  { key: "dob", label: "Date of Birth", type: "date", required: true },
  { key: "residency", label: "Residency Status", options: ["Australian Citizen", "Permanent Resident", "Temporary Resident", "Other"], required: true },
  { key: "marital", label: "Marital Status", options: ["Single", "Married", "De Facto", "Separated", "Divorced", "Widowed"], required: true },
  { key: "licence", label: "Driver's Licence Number", required: true },
  { key: "licenceState", label: "Licence State", options: states, defaultValue: "WA" },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel", required: true },
];

const addressFields: FieldDefinition[] = [
  { key: "street", label: "Street Address", required: true },
  { key: "suburb", label: "Suburb", required: true },
  { key: "state", label: "State", options: states, defaultValue: "WA", required: true },
  { key: "postcode", label: "Postcode", required: true },
  { key: "monthsAtAddress", label: "Time at Address (months)", type: "number", required: true },
  { key: "livingSituation", label: "Living Situation", options: ["Renting", "Own Home With Mortgage", "Own Home Outright", "Boarding", "Living With Family", "Other"], required: true },
  { key: "rent", label: "Monthly Rent / Mortgage ($)", type: "number", required: true },
  { key: "landlord", label: "Landlord / Agent Name", required: true },
  { key: "landlordPhone", label: "Landlord / Agent Contact Number", type: "tel", required: true },
  { key: "previousAddress", label: "Previous Address (if less than 2 years at current)" },
  { key: "previousMonths", label: "Time at Previous (months)", type: "number" },
];

const employmentFields: FieldDefinition[] = [
  { key: "employment", label: "Employment Status", options: ["Full Time", "Part Time", "Casual", "Self Employed", "Contract", "Unemployed", "Retired", "Centrelink", "Other"], required: true },
  { key: "income", label: "Net Monthly Income ($, after tax)", type: "number", required: true },
  { key: "employer", label: "Employer Name", required: true },
  { key: "employerPhone", label: "Employer Contact Number", type: "tel", required: true },
  { key: "jobTitle", label: "Job Title", required: true },
  { key: "monthsInRole", label: "Time in Role (months)", type: "number", required: true },
  { key: "previousEmployer", label: "Previous Employer Name", required: true },
  { key: "otherIncome", label: "Other Income ($ / month)", type: "number" },
  { key: "otherIncomeSource", label: "Other Income Source", placeholder: "e.g. Centrelink, rental income" },
];

const expenseFields: FieldDefinition[] = [
  { key: "food", label: "Food & Groceries", type: "number", required: true },
  { key: "utilities", label: "Utilities & Property Expenses", type: "number", required: true },
  { key: "communication", label: "Communication", type: "number", required: true },
  { key: "transport", label: "Transport", type: "number", required: true },
  { key: "insurance", label: "Insurances", type: "number", required: true },
  { key: "clothing", label: "Clothing & Personal Care", type: "number", required: true },
  { key: "medical", label: "Ongoing Medical & Health and Fitness", type: "number", required: true },
  { key: "childcare", label: "Childcare", type: "number", required: true },
  { key: "recreation", label: "Recreation Travel & Entertainment", type: "number", required: true },
  { key: "otherExpenses", label: "Other Expenses", type: "number", required: true },
  { key: "dependants", label: "Number of Dependants", type: "number", required: true },
];

const loanFields: FieldDefinition[] = [
  { key: "loanAmount", label: "Loan Amount ($)", type: "number", required: true },
  { key: "weeklyBudget", label: "Weekly Payment Budget ($)", type: "number", required: true },
  { key: "deposit", label: "Deposit / Trade-in ($)", type: "number" },
  { key: "vehicle", label: "Vehicle (if you've picked one)", placeholder: "e.g. 2019 Toyota Corolla" },
  { key: "creditHistory", label: "Credit History", options: ["Excellent", "Good", "Fair", "Poor", "Previous Defaults", "Bankruptcy", "Unsure"], required: true },
];

const documentDefinitions = [
  { key: "licenceFront", title: "Driver's Licence — Front", subtitle: "Photo or scan" },
  { key: "licenceBack", title: "Driver's Licence — Back", subtitle: "Photo or scan" },
  { key: "payslip", title: "Recent Payslip", subtitle: "Last 2 payslips ideal" },
  { key: "medicare", title: "Medicare Card", subtitle: "Optional" },
  { key: "rates", title: "Rates Notice / Proof of Address", subtitle: "Optional" },
  { key: "otherDocument", title: "Other Supporting Document", subtitle: "Optional" },
];

function FormField({
  definition,
  value,
  onChange,
}: {
  definition: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const className =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <label className="block min-w-0">
      <span className="text-sm font-medium text-slate-700">
        {definition.label}
        {definition.required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {definition.options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        >
          <option value="">Select one</option>
          {definition.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={definition.type || "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={definition.placeholder || ""}
          min={definition.type === "number" ? 0 : undefined}
          className={className}
        />
      )}
    </label>
  );
}

function DocumentPreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<string | null>(null);

  // Create and clean up the temporary image URL.

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const size = (file.size / 1024 / 1024).toFixed(2);

  return (
    <div className="mt-4 space-y-3">
      {preview && (
        <img
          src={preview}
          alt="Selected document preview"
          className="max-h-44 w-full rounded-lg border border-slate-200 object-contain"
        />
      )}

      {!preview && (
        <div className="flex items-center gap-2 text-slate-500">
          <FileText size={20} />
          <span className="text-xs">PDF document selected</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-emerald-700">
        <CheckCircle2 size={16} className="shrink-0" />
        <span className="min-w-0 truncate text-xs font-medium">
          {file.name}
        </span>
        <span className="shrink-0 text-xs text-slate-500">
          {size} MB
        </span>
      </div>
    </div>
  );
}

function Section({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  const config = sections[number - 1];
  const Icon = config.icon;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon size={23} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Section {number}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {config.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">{children}</div>
    </section>
  );
}

export default function FinanceApplicationPage() {
  const defaults = [
    ...personalFields,
    ...addressFields,
    ...employmentFields,
    ...expenseFields,
    ...loanFields,
  ].reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.defaultValue ?? "";
    return acc;
  }, {});

  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [applicationType, setApplicationType] = useState("Private");
  const [applicants, setApplicants] = useState("Single");
  const [assets, setAssets] = useState<Entry[]>([]);
  const [liabilities, setLiabilities] = useState<Entry[]>([]);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [consent, setConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [metaConsent, setMetaConsent] = useState(false);
  const [signature, setSignature] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedId, setSubmittedId] = useState("");


  const allFields = [
    ...personalFields,
    ...addressFields,
    ...employmentFields,
    ...expenseFields,
    ...loanFields,
  ];

  const employedStatuses = [
    "Full Time",
    "Part Time",
    "Casual",
    "Self Employed",
    "Contract",
  ];

  const isEmployed = employedStatuses.includes(form.employment);


  const activeRequiredFields = allFields.filter((field) => {
    // Previous employer only required under 3 months
    if (field.key === "previousEmployer") {
      return (
        isEmployed &&
        form.monthsInRole !== "" &&
        Number(form.monthsInRole) < 3
      );
    }

    // Previous address only required under 36 months
    if (
      field.key === "previousAddress" ||
      field.key === "previousMonths"
    ) {
      return (
        form.monthsAtAddress !== "" &&
        Number(form.monthsAtAddress) < 36
      );
    }

    // Other income source only if other income is declared
    if (field.key === "otherIncomeSource") {
      return Number(form.otherIncome) > 0;
    }

    if (!field.required) return false;

    // Employer fields only required if currently employed
    if (
      ["employer", "employerPhone", "jobTitle", "monthsInRole"]
        .includes(field.key)
    ) {
      return isEmployed;
    }

    return true;
  });

  const missingFields = activeRequiredFields.filter(
    (field) => !String(form[field.key] ?? "").trim()
  );

  const missingDocuments = [
    { key: "licenceFront", label: "Driver's Licence — Front" },
    { key: "licenceBack", label: "Driver's Licence — Back" },
    { key: "payslip", label: "Recent Payslip" },
  ].filter((document) => !files[document.key]);

  const missingSignature = !signature.trim();
  const missingConsent = !consent;

  const isApplicationComplete =
    missingFields.length === 0 &&
    missingDocuments.length === 0 &&
    !missingSignature &&
    !missingConsent;

async function submitApplication() {
  setSubmitError("");
  setShowValidation(true);

  if (
    missingFields.length > 0 ||
    missingSignature ||
    missingConsent
  ) {
    setSubmitError(
      "Please complete all required fields, signature and consent."
    );
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch("/api/finance/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        form,
        applicationType,
        applicants,
        assets,
        liabilities,
        consent,
        signature,
        smsConsent,
        metaConsent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Submission failed.");
    }

    setSubmittedId(result.applicationId);
  } catch (error) {
    setSubmitError(
      error instanceof Error
        ? error.message
        : "Unable to submit application."
    );
  } finally {
    setSubmitting(false);
  }
}

  function update(key: string, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function fields(definitions: FieldDefinition[]) {
    return (
      <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
        {definitions.map((definition) => (
          <FormField
            key={definition.key}
            definition={definition}
            value={form[definition.key] ?? ""}
            onChange={(value) => update(definition.key, value)}
          />
        ))}
      </div>
    );
  }

  function addEntry(kind: "asset" | "liability") {
    const entry: Entry = {
      id: Date.now() + Math.random(),
      type: "",
      description: "",
      amount: "",
      monthlyRepayment: "",
    };

    if (kind === "asset") {
      setAssets((previous) => [...previous, entry]);
    } else {
      setLiabilities((previous) => [...previous, entry]);
    }
  }

  function updateEntry(
    kind: "asset" | "liability",
    id: number,
    key: keyof Entry,
    value: string
  ) {
    const setter = kind === "asset" ? setAssets : setLiabilities;
    setter((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, [key]: value } : entry
      )
    );
  }

  function removeEntry(kind: "asset" | "liability", id: number) {
    const setter = kind === "asset" ? setAssets : setLiabilities;
    setter((previous) => previous.filter((entry) => entry.id !== id));
  }

  function entryEditor(kind: "asset" | "liability") {
    const entries = kind === "asset" ? assets : liabilities;
    const isAsset = kind === "asset";

    const types = isAsset
      ? ["Vehicle", "Property", "Savings", "Shares", "Superannuation", "Other"]
      : ["Car Loan", "Personal Loan", "Credit Card", "Mortgage", "Buy Now Pay Later", "Other"];

    return (
      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            {isAsset
              ? "No assets added — that's OK."
              : "No liabilities added."}
          </p>
        )}

        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {isAsset ? "Asset" : "Liability"} {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEntry(kind, entry.id)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                aria-label="Remove entry"
              >
                <Trash2 size={17} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                Type
                <select
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
                  value={entry.type}
                  onChange={(e) =>
                    updateEntry(kind, entry.id, "type", e.target.value)
                  }
                >
                  <option value="">Select type</option>
                  {types.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Description
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
                  value={entry.description}
                  onChange={(e) =>
                    updateEntry(kind, entry.id, "description", e.target.value)
                  }
                  placeholder="Details"
                />
              </label>

              <label className="text-sm text-slate-600">
                {isAsset ? "Value ($)" : "Balance Owing ($)"}
                <input
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
                  value={entry.amount}
                  onChange={(e) =>
                    updateEntry(kind, entry.id, "amount", e.target.value)
                  }
                />
              </label>
              {!isAsset && (
                <label className="text-sm text-slate-600">
                  Monthly Repayment ($)
                  <input
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3"
                    value={entry.monthlyRepayment}
                    onChange={(e) =>
                      updateEntry(
                        kind,
                        entry.id,
                        "monthlyRepayment",
                        e.target.value
                      )
                    }
                    placeholder="e.g. 350"
                  />
                </label>
              )}

            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addEntry(kind)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus size={17} />
          Add {isAsset ? "Asset" : "Liability"}
        </button>
      </div>
    );
  }

  const optionButton = (
    label: string,
    value: string,
    current: string,
    onChange: (value: string) => void
  ) => (
    <button
      type="button"
      key={value}
      onClick={() => onChange(value)}
      className={`rounded-xl border px-6 py-3 text-sm font-semibold transition ${
        current === value
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  
if (submittedId) {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto mt-20 max-w-lg rounded-2xl border bg-white p-10 text-center shadow-sm">
        <CheckCircle2
          size={56}
          className="mx-auto text-emerald-600"
        />

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Test Application Submitted!
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Your application has been saved to PostgreSQL.
        </p>

        <p className="mt-4 break-all rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Application ID: {submittedId}
        </p>

        <a
          href="/broker"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
        >
          View Broker Portal
        </a>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-slate-900 px-7 py-9 text-white sm:px-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
            <CarFront size={15} />
            CARMART PERTH
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            We Work Harder to Help
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Apply for car finance online — all credit profiles welcome,
            including bad credit, defaults and Centrelink. Takes about
            10 minutes; have your licence and recent payslips ready.
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Finance is subject to lender approval, lending criteria and
            your individual circumstances.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>UI Preview:</strong> This localhost form is not connected
          to the broker database. Do not enter real customer information
          or upload real identity documents while testing.
        </div>

        {/* Section 1 */}
        <Section number={1}>
          <div className="space-y-7">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Is this a single or joint finance application? *
              </p>
              <div className="flex gap-3">
                {["Single", "Joint"].map((item) =>
                  optionButton(item, item, applicants, setApplicants)
                )}
              </div>
            </div>

            {fields(personalFields)}
          </div>
        </Section>

        {/* Section 2 */}
        <Section number={2}>
          {fields(
            addressFields.filter((field) => {
              const months = Number(form.monthsAtAddress);

              if (
                field.key === "previousAddress" ||
                field.key === "previousMonths"
              ) {
                return (
                  form.monthsAtAddress !== "" &&
                  Number.isFinite(months) &&
                  months < 36
                );
              }

              return true;
            })
          )}
        </Section>

        {/* Section 3 */}
        <Section number={3}>
          {fields(
            employmentFields.filter((field) => {
              const employment = form.employment;

              const currentlyEmployed = [
                "Full Time",
                "Part Time",
                "Casual",
                "Self Employed",
                "Contract",
              ].includes(employment);

              const employerFields = [
                "employer",
                "employerPhone",
                "jobTitle",
                "monthsInRole",
              ];

              // Show current employer details only if employed
              if (employerFields.includes(field.key)) {
                return currentlyEmployed;
              }

              // Previous employer only if current role is under 3 months
              if (field.key === "previousEmployer") {
                return (
                  currentlyEmployed &&
                  form.monthsInRole !== "" &&
                  Number(form.monthsInRole) < 3
                );
              }

              // Other income source only if additional income is declared
              if (field.key === "otherIncomeSource") {
                return Number(form.otherIncome) > 0;
              }

              return true;
            })
          )}
        </Section>

        {/* Section 4 */}
        <Section number={4}>
          <div className="space-y-9">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Monthly Living Expenses
              </h3>
              <p className="mt-1 mb-6 text-sm text-slate-500">
                Expenses per month, excluding rent. Enter 0 for
                anything that doesn't apply.
              </p>
              {fields(expenseFields)}
            </div>

            <div className="border-t border-slate-100 pt-7">
              <h3 className="mb-2 text-lg font-bold text-slate-900">
                Assets (what you own)
              </h3>
              {entryEditor("asset")}
            </div>

            <div className="border-t border-slate-100 pt-7">
              <h3 className="mb-2 text-lg font-bold text-slate-900">
                Liabilities (what you owe)
              </h3>
              {entryEditor("liability")}
            </div>
          </div>
        </Section>

        {/* Section 5 */}
        <Section number={5}>
          <div className="space-y-6">
            {fields(loanFields)}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Anything else we should know?
              </span>
              <textarea
                rows={5}
                value={form.additionalNotes ?? ""}
                onChange={(e) => update("additionalNotes", e.target.value)}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"
                placeholder="Additional details about your application..."
              />
            </label>
          </div>
        </Section>


        {/* Section 6 */}
        <Section number={6}>
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">
                    Supporting Documents
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Please provide clear photos or PDF copies of your
                    supporting documents. Each file must be 15 MB or smaller.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {documentDefinitions.map((doc) => {
                const file = files[doc.key];

                const requiredDocuments = [
                  "licenceFront",
                  "licenceBack",
                  "payslip",
                ];

                const isRequired = requiredDocuments.includes(doc.key);

                return (
                  <div
                    key={doc.key}
                    className={`rounded-xl border p-5 transition ${
                      file
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-xl bg-slate-100 p-3">
                        <FileUp size={21} className="text-slate-600" />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isRequired
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isRequired ? "Required" : "Optional"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        {doc.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {doc.subtitle}
                      </p>
                    </div>

                    {file && <DocumentPreview file={file} />}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        <FileUp size={16} />
                        {file ? "Replace File" : "Choose File"}

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(event) => {
                            const selected = event.target.files?.[0];

                            if (!selected) return;

                            const allowedTypes = [
                              "application/pdf",
                              "image/jpeg",
                              "image/png",
                              "image/webp",
                            ];

                            if (!allowedTypes.includes(selected.type)) {
                              alert("Please select a PDF, JPG, PNG or WebP file.");
                              event.target.value = "";
                              return;
                            }

                            if (selected.size > 15 * 1024 * 1024) {
                              alert("File must be 15 MB or smaller.");
                              event.target.value = "";
                              return;
                            }

                            setFiles((previous) => ({
                              ...previous,
                              [doc.key]: selected,
                            }));

                            event.target.value = "";
                          }}
                        />
                      </label>

                      {file && (
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((previous) => ({
                              ...previous,
                              [doc.key]: null,
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>Local testing only:</strong> Files are selected and
                previewed in your browser. They are not uploaded,
                transmitted, or saved to the database.
                Please use sample documents rather than real customer IDs.
              </p>
            </div>
          </div>
        </Section>

        {/* Section 7 */}
        <Section number={7}>
          <div className="space-y-6">
            
            {/* Application Completion Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Application Summary
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Check your details before submitting.
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isApplicationComplete
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isApplicationComplete ? "Ready for Review" : "Incomplete"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Applicant", `${form.firstName || "—"} ${form.lastName || ""}`],
                  ["Application Type", `${applicationType} / ${applicants}`],
                  ["Mobile", form.phone || "—"],
                  ["Email", form.email || "—"],
                  ["Employment", form.employment || "—"],
                  [
                    "Monthly Income",
                    form.income
                      ? `$${Number(form.income).toLocaleString("en-AU")}`
                      : "—",
                  ],
                  [
                    "Requested Loan",
                    form.loanAmount
                      ? `$${Number(form.loanAmount).toLocaleString("en-AU")}`
                      : "—",
                  ],
                  ["Vehicle", form.vehicle || "Not selected"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowValidation((previous) => !previous)}
                className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {showValidation ? "Hide Checklist" : "Check Missing Information"}
              </button>

              {showValidation && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                  {isApplicationComplete ? (
                    <p className="text-sm font-medium text-emerald-700">
                      All currently required fields and documents are present.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Information Still Required
                      </h4>

                      {missingFields.map((field) => (
                        <p key={field.key} className="text-sm text-red-600">
                          • {field.label}
                        </p>
                      ))}

                      {missingDocuments.map((document) => (
                        <p key={document.key} className="text-sm text-red-600">
                          • {document.label}
                        </p>
                      ))}

                      {missingSignature && (
                        <p className="text-sm text-red-600">
                          • Electronic Signature
                        </p>
                      )}

                      {missingConsent && (
                        <p className="text-sm text-red-600">
                          • Privacy and Credit Consent
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-700" />
                <h3 className="font-bold text-slate-900">
                  Privacy & Credit Consent Documents
                </h3>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Please review these documents before submitting a
                real finance application.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="https://www.carmartperth.com.au/carmart-privacy-consent.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  <FileText size={17} />
                  Carmart Perth Privacy Consent & Credit Information Authority
                </a>

                <a
                  href="https://www.carmartperth.com.au/baisden-consent.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  <FileText size={17} />
                  Baisden Pty Ltd Credit Guide & Privacy Consent
                </a>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 accent-slate-900"
              />
              <span className="text-sm leading-6 text-slate-700">
                I confirm that the information I have provided is true
                and complete. I have read and understood the privacy
                and consent documents above.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Type your full legal name as your electronic signature *
              </span>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. Jane Elizabeth Smith"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
              <p className="mt-2 text-xs text-slate-500">
                Demo only. No legally operative signature or consent
                record is created.
              </p>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 accent-slate-900"
              />
              <span className="text-sm text-slate-700">
                Text me updates about my application (SMS). No marketing.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={metaConsent}
                onChange={(e) => setMetaConsent(e.target.checked)}
                className="mt-1 h-4 w-4 accent-slate-900"
              />
              <span className="text-sm leading-6 text-slate-700">
                Optional: share my hashed contact information with Meta
                (Facebook and Instagram) for advertising measurement.
                No financial information or documents are shared.
              </span>
            </label>

            <div className="border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={submitApplication}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <ClipboardCheck size={19} />
                {submitting ? "Submitting..." : "Submit Test Application"}
              </button>

              {submitError && (
                <p className="mt-3 text-sm text-red-600">
                  {submitError}
                </p>
              )}
              <p className="mt-3 text-center text-xs text-slate-500">
                Submission is disabled until secure backend integration
                and consent recording are implemented.
              </p>
            </div>
          </div>
        </Section>

        <div className="py-6 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Carmart Perth
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Finance Application — Local Interface Preview
          </p>
        </div>
      </div>
    </main>
  );
}
