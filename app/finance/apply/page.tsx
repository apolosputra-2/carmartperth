
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
ArrowRight,
BadgeCheck,
Clock3,
LockKeyhole,
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
  { title: "Expenses", icon: Wallet, subtitle: "Your monthly expenses, dependants and existing loans." },
  { title: "Your Loan", icon: CarFront, subtitle: "What you're borrowing and the car you have in mind." },
  { title: "Supporting Documents", icon: FileUp, subtitle: "Optional documents to support your application." },
  { title: "Review & Submit", icon: ClipboardCheck, subtitle: "Read the privacy and consent documents before submitting." },
];

const personalFields: FieldDefinition[] = [
  { key: "firstName", label: "First / Company Name", required: true },
  { key: "middleName", label: "Middle Name" },
  { key: "lastName", label: "Last Name", required: true },
  { key: "dob", label: "Date of Birth", type: "date", required: true },
  {
    key: "residency",
    label: "Residency Status",
    options: ["Citizen", "Permanent Resident", "Visa Holder"],
    defaultValue: "Citizen",
    required: true,
  },
  {
    key: "visaSubclass",
    label: "Visa Subclass Number",
    placeholder: "e.g. 500, 485, 482",
    required: true,
  },  
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
  { key: "rent", label: "Rent / Mortgage Amount ($)", type: "number" },  { key: "rentFrequency", label: "Payment Frequency", options: ["Weekly", "Fortnightly", "Monthly"], defaultValue: "Monthly", },
  { key: "landlord", label: "Landlord / Agent Name", required: true },
  { key: "landlordPhone", label: "Landlord / Agent Contact Number", type: "tel", required: true },
];

const employmentFields: FieldDefinition[] = [
  { key: "employment", label: "Employment Status", options: ["Full Time", "Part Time", "Casual", "Self Employed", "Contract", "Unemployed", "Retired", "Centrelink", "Other"], required: true },
  { key: "income", label: "Net Income ($, after tax)", type: "number" },
  { key: "incomeFrequency", label: "Income Frequency", options: ["Weekly", "Fortnightly", "Monthly"], defaultValue: "Monthly", },
  { key: "employer", label: "Employer Name", required: true },
  { key: "employerPhone", label: "Employer Contact Number", type: "tel", required: true },
  { key: "jobTitle", label: "Job Title", required: true },
  { key: "monthsInRole", label: "Time in Role (months)", type: "number", required: true },
  { key: "previousEmployer", label: "Previous Employment", required: true,},
  { key: "otherIncome", label: "Other Income ($)", type: "number" },
  { key: "otherIncomeFrequency", label: "Other Income Frequency", options: ["Weekly", "Fortnightly", "Monthly"], defaultValue: "Monthly" },
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
  { key: "vehicle", label: "Vehicle (if you've picked one)", placeholder: "e.g. 2019 Toyota Corolla" },
  { key: "creditHistory", label: "Credit History", options: ["Excellent", "Good", "Fair", "Poor", "Previous Defaults", "Bankruptcy", "Unsure"], required: true },
];


const documentDefinitions = [
  {
    key: "licenceFront",
    title: "Driver's Licence — Front",
    subtitle: "Upload a clear photo of the front of your driver's licence.",
  },
  {
    key: "licenceBack",
    title: "Driver's Licence — Back",
    subtitle: "Upload a clear photo of the back of your driver's licence.",
  },
  {
    key: "medicareFront",
    title: "Medicare Card — Front",
    subtitle: "Upload a clear photo of the front of your Medicare card.",
  },
  {
    key: "medicareBack",
    title: "Medicare Card — Back",
    subtitle: "Upload a clear photo of the back of your Medicare card.",
  },
  {
    key: "payslip1",
    title: "Recent Payslip / Income Statement 1",
    subtitle: "Upload your most recent payslip or income statement.",
  },
  {
    key: "payslip2",
    title: "Recent Payslip / Income Statement 2",
    subtitle: "Upload your second most recent payslip or income statement.",
  },
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
    "mt-2 w-full min-h-12 rounded-xl border border-[#3A3D50] bg-[#111624] px-4 py-3 text-[15px] text-[#F6F7FF] shadow-sm outline-none transition-all duration-200 [color-scheme:dark] placeholder:text-[#8590A8] hover:border-[#6C7291] focus:border-[#22D3EE] focus:ring-4 focus:ring-violet-500/20";

  if (definition.key === "previousEmployer") {
    const status =
      value === "Unemployed"
        ? "unemployed"
        : value === "Centrelink"
          ? "centrelink"
          : value.startsWith("EMPLOYED:")
            ? "employed"
            : "";

    return (
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold text-[#DFE3F3]">
          Previous Employment Status
          <span className="ml-1 text-rose-400">*</span>
        </legend>

        <div className="mt-3 space-y-3">
          {[
            { value: "employed", label: "Previously employed" },
            { value: "unemployed", label: "Previously unemployed" },
            {
              value: "centrelink",
              label: "Receiving Centrelink payments",
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                status === option.value
                  ? "border-violet-400 bg-violet-500/20 text-violet-100"
                  : "border-[#3A3D50] bg-[#1B1E2B] text-[#C5CDE1] hover:border-violet-400/70 hover:bg-violet-500/10"
              }`}
            >
              <input
                type="radio"
                name="previousEmploymentStatus"
                checked={status === option.value}
                onChange={() => {
                  if (option.value === "unemployed") {
                    onChange("Unemployed");
                  } else if (option.value === "centrelink") {
                    onChange("Centrelink");
                  } else {
                    onChange("EMPLOYED:");
                  }
                }}
                className="h-4 w-4 accent-violet-500"
              />
              {option.label}
            </label>
          ))}
        </div>

        {status === "employed" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[#D0D7E8]">
              Previous Employer Name
              <span className="ml-1 text-rose-400"></span>
              <input
                type="text"
                value={value.startsWith("EMPLOYED:") ? value.slice(9) : ""}
                onChange={(event) => onChange(`EMPLOYED:${event.target.value}`)}
                placeholder="Enter previous employer name"
                className={className}
              />
            </label>
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <label className="block min-w-0">
      <span className="text-[13px] font-semibold text-[#DCE4F5]">
        {definition.label}
          {["firstName", "lastName", "phone"].includes(definition.key) && (
            <span className="ml-1 text-rose-400">*</span>
          )}
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
        className="max-h-44 w-full rounded-lg border border-[#323748] object-contain"
      />
    )}

    {!preview && (
      <div className="flex items-center gap-2 text-[#A4ADC5]">
        <FileText size={20} />
        <span className="text-xs">PDF document selected</span>
      </div>
    )}

    <div className="flex items-center gap-2 text-emerald-300">
      <CheckCircle2 size={16} className="shrink-0" />
      <span className="min-w-0 truncate text-xs font-medium">
        {file.name}
      </span>
      <span className="shrink-0 text-xs text-[#A4ADC5]">
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
  <section
    id={`section-${number}`}
    className="scroll-mt-8 overflow-hidden rounded-[24px] border border-[#343746] bg-[#1B1E2B] shadow-[0_12px_42px_-25px_rgba(0,0,0,0.6)]"
  >
    <div className="relative overflow-hidden border-b border-[#343746] bg-gradient-to-r from-[#191D2B] via-[#252039] to-[#1B2934] px-5 py-6 sm:px-9 sm:py-7">

      {/* Subtle rainbow accent */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 via-pink-500 to-amber-400" />

      <div className="relative flex items-start gap-4">
        {/* Section icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-cyan-300 shadow-sm">
          <Icon size={22} strokeWidth={1.9} />
        </div>

        {/* Section heading */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            Step {number} / 7
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-[25px]">
            {config.title}
          </h2>

          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-400">
            {config.subtitle}
          </p>
        </div>
      </div>
    </div>

    {/* Section content */}
    <div className="p-5 sm:p-9">
      {children}
    </div>
  </section>
);
}

export default function FinanceApplicationPage() {
  const [submittedReference, setSubmittedReference] = useState("");
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

const activeRequiredFields = allFields.filter((field) =>
  ["firstName", "lastName", "phone"].includes(field.key)
);

const missingFields = activeRequiredFields.filter(
(field) => !String(form[field.key] ?? "").trim()
);

const missingDocuments: {
  key: string;
  label: string;
}[] = [];


const normalizeName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const fullApplicantName = [
  form.firstName,
  form.middleName,
  form.lastName,
]
  .filter((part) => part?.trim())
  .join(" ");

const missingSignature =
  !signature.trim() ||
  normalizeName(signature) !== normalizeName(fullApplicantName);

const missingConsent = !consent;


const isApplicationComplete =
  missingFields.length === 0 &&
  !missingSignature &&
  !missingConsent;


async function submitApplication() {
  setSubmitError(
    missingSignature
      ? "Your electronic signature must match your full name in Section 1."
      : "Please complete the required information and consent."
  );
  setShowValidation(true);

  if (
    missingFields.length > 0 ||
    missingDocuments.length > 0 ||
    missingSignature ||
    missingConsent
  ) {
  setSubmitError(
    "Please complete all required fields, upload the required documents, and provide your signature and consent."
  );
    return;
  }

  setSubmitting(true);

  try {

  const submissionData = new FormData();

  submissionData.append(
  "application",
  JSON.stringify({
    form,
    applicationType,
    applicants,
    assets,
    liabilities,
    consent,
    signature,
    smsConsent,
    metaConsent,
  })
  );

  // Attach each selected document.
  for (const [category, file] of Object.entries(files)) {
    if (file) {
      submissionData.append(`document_${category}`, file);
    }
    }

    const response = await fetch("/api/finance/submit", {
    method: "POST",
    body: submissionData,
    });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed.");
      }

    setSubmittedId(result.applicationId);
    setSubmittedReference(
      result.displayReference || result.applicationId
    );
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
    : ["Car Loan", "Personal Loan", "Mortgage", "Credit Card", "Buy Now Pay Later", "Other"];
  return (
    <div className="space-y-4">
      {entries.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#C8D9DD] bg-[#1A1E2D] px-4 py-5 text-sm text-[#60798A]">
          {isAsset
            ? "No assets added — that's OK."
            : "Add your existing loan details below."}
        </p>
      )}

      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-2xl border border-[#34394B] bg-[#1D2231] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#D0D7E8]">
              {isAsset ? "Asset" : "Loan"} {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEntry(kind, entry.id)}
              className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"
              aria-label="Remove entry"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-[#A4B2CB]">
              Type
              <select
                className="mt-2 w-full min-h-11 rounded-xl border border-[#3A3D50] bg-[#111624] p-3 text-[#F2F5FF] [color-scheme:dark] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20"
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

            <label className="text-sm text-[#A4B2CB]">
              {isAsset ? "Description" : "Lender Name"}
              <input
                className="mt-2 w-full min-h-11 rounded-xl border border-[#3A3D50] bg-[#111624] p-3 text-[#F2F5FF] [color-scheme:dark] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20"
                value={entry.description}
                onChange={(e) =>
                  updateEntry(kind, entry.id, "description", e.target.value)
                }
                placeholder={isAsset ? "Details" : "e.g. NAB, Westpac"}
              />
            </label>

            <label className="text-sm text-[#A4B2CB]">
              {isAsset ? "Value ($)" : "Outstanding Balance ($)"}
              <input
                type="number"
                min="0"
                className="mt-2 w-full min-h-11 rounded-xl border border-[#3A3D50] bg-[#111624] p-3 text-[#F2F5FF] [color-scheme:dark] outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20"
                value={entry.amount}
                onChange={(e) =>
                  updateEntry(kind, entry.id, "amount", e.target.value)
                }
              />
            </label>
            {!isAsset && (
              <label className="text-sm text-[#A4B2CB]">
                Monthly Repayment ($)
                <input
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-lg border border-[#323748] bg-[#1B1E2B] p-3"
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
        className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-[#34394B] bg-[#1B1E2B] px-4 py-3 text-sm font-semibold text-[#C7D2E8] transition hover:border-violet-400 hover:bg-violet-500/10"
      >
        <Plus size={17} />
        Add {isAsset ? "Asset" : "Loan"}
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
    className={`min-h-11 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 ${
      current === value
        ? "border-violet-400 bg-violet-600 text-white shadow-[0_6px_16px_-8px_rgba(13,148,136,0.9)]"
        : "border-[#34394B] bg-[#1B1E2B] text-[#C5CDE1] hover:border-violet-400 hover:bg-violet-500/10"
    }`}
  >
    {label}
  </button>
);


if (submittedId) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090B12] px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#151A28] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.65)]">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500" />

        <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 size={30} strokeWidth={2.2} />
            </div>
          </div>

          <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.28em] text-cyan-300">
            Carmart Perth Finance
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Application received
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#AAB6D3] sm:text-base">
            Thank you — your application has been submitted successfully.
            Our team will review it and contact you if any further
            information is needed.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-[#1B2133] px-5 py-5 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F8CAA] text-center">
              Application Reference
            </p>
            <p className="mt-2 text-2xl font-bold tracking-wide text-white text-center">
              {submittedReference || submittedId}
            </p>
          </div>

          <p className="mt-6 text-xs text-[#7F8CAA]">
            Development testing only. Do not submit real customer information.
          </p>
        </div>
      </div>
    </main>
  );
}

return (
  <main className="min-h-screen bg-[#090B12] text-[#F0F4FF] [color-scheme:dark]">
    <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-violet-500 via-fuchsia-500 to-amber-400" />

    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-9">
      <div className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-[#11192B] via-[#1C1732] to-[#101D2D] px-6 py-9 text-white shadow-[0_24px_60px_-28px_rgba(16,39,59,0.56)] sm:px-12 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-100">
            <BadgeCheck size={14} /> Carmart Perth Finance
          </div>
          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-tight sm:text-[46px]">
            Your next car starts <span className="text-[#BAA5FF]">here.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#CBD2E7]">
            We work harder to help. Tell us a little about yourself and what you need, and our finance team can review your application.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#D9E8EC]">
            <span className="inline-flex items-center gap-2"><Clock3 size={16} className="text-[#7FE6D4]" /> Around 5–10 minutes</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#7FE6D4]" /> All credit profiles welcome</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#7FE6D4]" /> Review consent before submitting</span>
          </div>
          <p className="mt-7 text-[11px] leading-5 text-[#A7B4CE]">Finance is subject to lender approval, lending criteria and individual circumstances.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-[#332719] px-5 py-4 text-[13px] leading-6 text-amber-200">
        <strong>Development testing:</strong> This form submits to your local test backend. Please use dummy details and sample files only. Do not enter real customer information or upload actual identification documents.
      </div>

      {/* Section 1 */}
      <Section number={1}>
        <div className="space-y-7">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#D0D7E8]">
              Is this a single or joint finance application? *
            </p>
            <div className="flex gap-3">
              {["Single", "Joint"].map((item) =>
                optionButton(item, item, applicants, setApplicants)
              )}
            </div>
          </div>

          {fields(
            personalFields.filter(
              (field) =>
                field.key !== "visaSubclass" ||
                form.residency === "Visa Holder"
            )
          )}
        </div>
      </Section>

      {/* Section 2 */}
      <Section number={2}>
        {fields(addressFields)}
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
                ["Part Time", "Casual"].includes(employment) &&
                form.monthsInRole !== "" &&
                Number(form.monthsInRole) < 3
              );
            }

            // Other income source only if additional income is declared
            if (
              field.key === "otherIncome" ||
              field.key === "otherIncomeFrequency" ||
              field.key === "otherIncomeSource"
            ) {
              if (employment === "Centrelink") return false;

              if (field.key === "otherIncomeFrequency" || field.key === "otherIncomeSource") {
                return Number(form.otherIncome) > 0;
              }

              return true;
            }


            return true;
          })
        )}
      </Section>

    {/* Section 4 */}
    <Section number={4}>
      <div className="space-y-9">

        {/* Monthly Living Expenses */}
        <div>
          <h3 className="text-lg font-bold text-[#F1F4FC]">
            Monthly Living Expenses
          </h3>

          <p className="mb-6 mt-1 text-sm text-[#A4ADC5]">
            Enter your approximate monthly living expenses.
            Leave fields blank if you're unsure.
          </p>

          {fields(expenseFields)}
        </div>

        {/* Existing Loans */}
        <div className="border-t border-[#323749] pt-7">
          <h3 className="mb-4 text-lg font-bold text-[#F1F4FC]">
            Do you have any existing loans?
          </h3>

          <div className="flex gap-3">
            {["Yes", "No"].map((option) =>
              optionButton(
                option,
                option,
                form.hasLoans ?? "",
                (value) => update("hasLoans", value)
              )
            )}
          </div>

          {form.hasLoans === "Yes" && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-[#A4ADC5]">
                Add any existing loans you know about. All details are optional —
                your finance broker can contact you if more information is needed.
              </p>

              {entryEditor("liability")}
            </div>
          )}
        </div>

      </div>
    </Section>

    {/* Section 5 */}
    <Section number={5}>
      <div className="space-y-6">
        {fields(loanFields)}

        {/* Trade-in & Deposit */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Trade-in */}
          <div>
            <p className="mb-3 text-sm font-semibold text-[#D0D7E8]">
              Do you have a vehicle to trade in?
            </p>

            <div className="flex gap-3">
              {["Yes", "No"].map((option) =>
                optionButton(
                  option,
                  option,
                  form.hasTradeIn ?? "",
                  (value) => update("hasTradeIn", value)
                )
              )}
            </div>
          </div>

          {/* Deposit */}
          <div>
            <p className="mb-3 text-sm font-semibold text-[#D0D7E8]">
              Are you willing to put down a deposit?
            </p>

            <div className="flex gap-3">
              {["Yes", "No"].map((option) =>
                optionButton(
                  option,
                  option,
                  form.hasDeposit ?? "",
                  (value) => {
                    setForm((previous) => ({
                      ...previous,
                      hasDeposit: value,
                      deposit:
                        value === "No" ? "" : previous.deposit ?? "",
                    }));
                  }
                )
              )}
            </div>

            {form.hasDeposit === "Yes" && (
              <div className="mt-5">
                {fields([
                  {
                    key: "deposit",
                    label: "Deposit Amount ($)",
                    type: "number",
                    placeholder: "e.g. 2000",
                  },
                ])}
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>



      {/* Section 6 */}
      <Section number={6}>
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2A4553] bg-[#152B36] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#67E8F9]"
              />
              <div>
                <h3 className="text-sm font-semibold text-[#AAECF7]">
                  Supporting Documents
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#B4DEEA]">
                  Please provide clear photos or PDF copies of your
                  supporting documents. Each file must be 15 MB or smaller.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {documentDefinitions.map((doc) => {
              const file = files[doc.key];

              const isRequired = false;

              return (
                <div
                  key={doc.key}
                  className={`rounded-xl border p-5 transition ${
                    file
                      ? "border-emerald-500/35 bg-emerald-950/20"
                      : "border-[#323748] bg-[#1B1E2B]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-[#2A2E40] p-3">
                      <FileUp size={21} className="text-[#A4B2CB]" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-[#F1F4FC]">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#A4ADC5]">
                      {doc.subtitle}
                    </p>
                  </div>

                  {file && <DocumentPreview file={file} />}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#323748] bg-[#1B1E2B] px-4 py-2.5 text-sm font-semibold text-[#D0D7E8] transition hover:bg-[#1B2031]">
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
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/100/10"
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


          <div className="rounded-xl border border-amber-400/30 bg-[#332719] p-4">
            <p className="text-sm text-amber-200">
              <strong>Development testing only:</strong> Uploaded files are
              saved to private local storage for testing. Please use sample
              documents only. Do not upload real customer identity documents.
            </p>
          </div>
        </div>
      </Section>

      {/* Section 7 */}
      <Section number={7}>
        <div className="space-y-6">
          
          {/* Application Completion Summary */}
          <div className="rounded-xl border border-[#323748] bg-[#1B2031] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#F1F4FC]">
                  Application Summary
                </h3>
                <p className="mt-1 text-sm text-[#A4ADC5]">
                  Check your details before submitting.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isApplicationComplete
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-700"
                }`}
              >
                {isApplicationComplete ? "Ready for Review" : "Incomplete"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                [
                  "Applicant",
                  `${form.firstName || "—"} ${form.lastName || ""}`.trim(),
                ],
                ["Application Type", `${applicationType} / ${applicants}`],
                ["Mobile", form.phone || "—"],
                ["Email", form.email || "—"],
                ["Employment", form.employment || "Not provided"],
                [
                  "Net Income",
                  form.income
                    ? `$${Number(form.income).toLocaleString("en-AU")} ${
                        form.incomeFrequency || "Monthly"
                      }`
                    : "Not provided",
                ],
                [
                  "Requested Loan",
                  form.loanAmount
                    ? `$${Number(form.loanAmount).toLocaleString("en-AU")}`
                    : "Not provided",
                ],
                ["Vehicle", form.vehicle || "Not selected"],
                ["Existing Loans", form.hasLoans || "Not specified"],
                ["Vehicle Trade-in", form.hasTradeIn || "Not specified"],
                ["Deposit", form.hasDeposit || "Not specified"],
                [
                  "Deposit Amount",
                  form.hasDeposit === "Yes" && form.deposit
                    ? `$${Number(form.deposit).toLocaleString("en-AU")}`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#1B1E2B] p-4">
                  <p className="text-xs text-[#A4ADC5]">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#F1F4FC]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowValidation((previous) => !previous)}
              className="mt-5 rounded-lg border border-[#323748] bg-[#1B1E2B] px-4 py-2.5 text-sm font-semibold text-[#D0D7E8] hover:bg-[#2A2E40]"
            >
              {showValidation ? "Hide Checklist" : "Check Missing Information"}
            </button>

            {showValidation && (
              <div className="mt-4 rounded-xl border border-[#323748] bg-[#1B1E2B] p-5">
                {isApplicationComplete ? (
                  <p className="text-sm font-medium text-emerald-300">
                    All currently required fields and documents are present.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-[#F1F4FC]">
                      Information Still Required
                    </h4>

                    {missingFields.map((field) => (
                      <p key={field.key} className="text-sm text-rose-300">
                        • {field.label}
                      </p>
                    ))}

                    {missingDocuments.map((document) => (
                      <p key={document.key} className="text-sm text-rose-300">
                        • {document.label}
                      </p>
                    ))}

                    {missingSignature && (
                      <p className="text-sm text-rose-300">
                        • Electronic signature must match your full name.
                      </p>
                    )}

                    {missingConsent && (
                      <p className="text-sm text-rose-300">
                        • Privacy and Credit Consent
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#2A4553] bg-[#152B36] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#67E8F9]" />
              <h3 className="font-bold text-[#F1F4FC]">
                Privacy & Credit Consent Documents
              </h3>
            </div>

            <p className="mt-2 text-sm text-[#A4B2CB]">
              Please review these documents before submitting a
              real finance application.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href="https://www.carmartperth.com.au/carmart-privacy-consent.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-[#67E8F9] hover:underline"
              >
                <FileText size={17} />
                Carmart Perth Privacy Consent & Credit Information Authority
              </a>

              <a
                href="https://www.carmartperth.com.au/baisden-consent.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-[#67E8F9] hover:underline"
              >
                <FileText size={17} />
                Baisden Pty Ltd Credit Guide & Privacy Consent
              </a>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-[#323748] p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-500"
            />
            <span className="text-sm leading-6 text-[#D0D7E8]">
              I confirm that the information I have provided is true
              and complete. I have read and understood the privacy
              and consent documents above.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#D0D7E8]">
              Type your full legal name as your electronic signature *
            </span>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="e.g. Jane Elizabeth Smith"
              className="mt-2 w-full rounded-xl border border-[#34394B] bg-[#111624] px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
            />

            <p className="mt-2 text-xs text-[#A4ADC5]">
              Please type your full legal name to confirm your application.
              This form is currently for development testing only.
            </p>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#323748] p-4">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-500"
            />
            <span className="text-sm text-[#D0D7E8]">
              Text me updates about my application (SMS). No marketing.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#323748] p-4">
            <input
              type="checkbox"
              checked={metaConsent}
              onChange={(e) => setMetaConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-500"
            />
            <span className="text-sm leading-6 text-[#D0D7E8]">
              Optional: share my hashed contact information with Meta
              (Facebook and Instagram) for advertising measurement.
              No financial information or documents are shared.
            </span>
          </label>

          <div className="border-t border-[#323749] pt-6">
            <button
              type="button"
              onClick={submitApplication}
              disabled={submitting}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#6D4BFA] px-6 py-4 text-[15px] font-bold text-white shadow-[0_12px_28px_-15px_rgba(11,130,118,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#855BFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-wait disabled:opacity-50"
            >
              <ClipboardCheck size={19} />
              {submitting ? "Submitting..." : "Submit Test Application"}
                {!submitting && <ArrowRight size={18} />}
            </button>

            {submitError && (
              <p className="mt-3 text-sm text-rose-300">
                {submitError}
              </p>
            )}
          </div>
        </div>
      </Section>

      <div className="py-6 text-center">
        <p className="text-sm font-semibold text-[#E4E8FA]">
          Carmart Perth
        </p>
        <p className="mt-2 text-xs text-[#A4ADC5]">
          Finance Application · Development Test Environment
        </p>
      </div>
    </div>
  </main>
);
}
