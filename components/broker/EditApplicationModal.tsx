
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save, ShieldCheck } from "lucide-react";

type LoanEntry = {
  type?: string;
  description?: string;
  amount?: string;
  monthlyRepayment?: string;
};

type EditApplicationModalProps = {
  applicationId: string;
  customerName: string;
  initialFields: Record<string, string>;
  initialLiabilities: LoanEntry[];
};

const groups = [
  {
    title: "Applicant",
    fields: [
        ["firstName", "First Name"],
        ["middleName", "Middle Name"],
        ["lastName", "Last Name"],
        ["dob", "Date of Birth"],
        ["residency", "Residency"],
        ["visaSubclass", "Visa Subclass Number"],
        ["marital", "Marital Status"],
        ["licence", "Licence Number"],
        ["licenceState", "Licence State"],
        ["email", "Email"],
        ["phone", "Phone"],
    ],
  },
  {
    title: "Address & Living",
    fields: [
        ["street", "Current Address"],
        ["suburb", "Suburb"],
        ["state", "State"],
        ["postcode", "Postcode"],
        ["monthsAtAddress", "Time at Address (months)"],
        ["livingSituation", "Living Situation"],
        ["rent", "Rent / Mortgage Amount ($)"],
        ["rentFrequency", "Rent / Mortgage Frequency"],
        ["landlord", "Landlord / Agent"],
        ["landlordPhone", "Landlord Contact Phone"],
    ],
  },
  {
    title: "Employment & Income",
    fields: [
        ["employment", "Employment Status"],
        ["employer", "Employer Name"],
        ["employerPhone", "Employer Phone"],
        ["jobTitle", "Job Title"],
        ["monthsInRole", "Time in Role (months)"],
        ["previousEmployer", "Previous Employment Status / Employer"],
        ["income", "Net Income After Tax ($)"],
        ["incomeFrequency", "Net Income Frequency"],
        ["otherIncome", "Other Income ($)"],
        ["otherIncomeSource", "Other Income Source"],
    ],
  },
  {
    title: "Expenses",
    fields: [
        ["food", "Food & Groceries"],
        ["utilities", "Utilities"],
        ["communication", "Communication"],
        ["transport", "Transport"],
        ["insurance", "Insurance"],
        ["clothing", "Clothing & Personal Care"],
        ["medical", "Medical & Fitness"],
        ["childcare", "Childcare"],
        ["recreation", "Recreation & Entertainment"],
        ["otherExpenses", "Other Expenses"],
        ["dependants", "Number of Dependants"],
        ["hasLoans", "Do You Have Any Existing Loans?"],
    ],
  },
  {
    title: "Loan Information",
    fields: [
        ["vehicle", "Vehicle"],
        ["loanAmount", "Requested Loan ($)"],
        ["weeklyBudget", "Weekly Payment Budget ($)"],
        ["hasTradeIn", "Do You Have a Vehicle to Trade In?"],
        ["hasDeposit", "Do You Have a Deposit?"],
        ["deposit", "Deposit Amount ($)"],
        ["creditHistory", "Credit History"],
    ],
  },
] as const;

const options: Record<string, string[]> = {
    residency: [
    "Citizen",
    "Permanent Resident",
    "Visa Holder",
    ],
    marital: [
        "Single",
        "Married",
        "De Facto",
        "Separated",
        "Divorced",
        "Widowed",
    ],
    licenceState: [
        "WA", "NSW", "VIC", "QLD",
        "SA", "TAS", "ACT", "NT",
    ],
    state: [
        "WA", "NSW", "VIC", "QLD",
        "SA", "TAS", "ACT", "NT",
    ],
    livingSituation: [
        "Renting",
        "Own Home With Mortgage",
        "Own Home Outright",
        "Boarding",
        "Living With Family",
        "Other",
    ],
    employment: [
        "Full Time",
        "Part Time",
        "Casual",
        "Self Employed",
        "Contract",
        "Unemployed",
        "Retired",
        "Centrelink",
        "Other",
    ],
    creditHistory: [
        "Excellent",
        "Good",
        "Fair",
        "Poor",
        "Previous Defaults",
        "Bankruptcy",
        "Unsure",
    ],
    rentFrequency: [
        "Weekly", 
        "Fortnightly",
        "Monthly"
    ],
    incomeFrequency: [
        "Weekly", 
        "Fortnightly",
        "Monthly"
    ],
    hasLoans: ["Yes", "No"],
    hasTradeIn: ["Yes", "No"],
    hasDeposit: ["Yes", "No"],
};

const numberFields = new Set([
  "monthsAtAddress",
  "previousMonths",
  "rent",
  "monthsInRole",
  "income",
  "otherIncome",
  "food",
  "utilities",
  "communication",
  "transport",
  "insurance",
  "clothing",
  "medical",
  "childcare",
  "recreation",
  "otherExpenses",
  "dependants",
  "loanAmount",
  "weeklyBudget",
  "deposit",
]);

const employedStatuses = [
  "Full Time",
  "Part Time",
  "Casual",
  "Self Employed",
  "Contract",
];

export default function EditApplicationModal({
  applicationId,
  customerName,
  initialFields,
  initialLiabilities,
}: EditApplicationModalProps) {

const router = useRouter();

const [open, setOpen] = useState(false);
const [fields, setFields] = useState(initialFields);
const [liabilities, setLiabilities] = useState<LoanEntry[]>(initialLiabilities);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

// Broker attestation
const [brokerName, setBrokerName] = useState("");
const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

const isEmployed = employedStatuses.includes(fields.employment);


function updateField(key: string, value: string) {
  setFields((previous) => ({
    ...previous,
    [key]: value,
    ...(key === "hasDeposit" && value === "No"
        ? { deposit: "" }
        : {}),
    ...(key === "residency" && value !== "Visa Holder"
        ? { visaSubclass: "" }
        : {}),
  }));
}


function addLoan() {
  setLiabilities((previous) => [
    ...previous,
    {
      type: "",
      description: "",
      amount: "",
      monthlyRepayment: "",
    },
  ]);
}

function updateLoan(
  index: number,
  key: keyof LoanEntry,
  value: string
) {
  setLiabilities((previous) =>
    previous.map((loan, position) =>
      position === index ? { ...loan, [key]: value } : loan
    )
  );
}

function removeLoan(index: number) {
  setLiabilities((previous) =>
    previous.filter((_, position) => position !== index)
  );
}

function close() {
    if (saving) return;

    setOpen(false);
    setFields(initialFields);
    setLiabilities(initialLiabilities);
    setBrokerName("");
    setAuthorityConfirmed(false);
    setError("");
}

function shouldShowField(key: string) {
    if (key === "deposit") {
    return (
        fields.hasDeposit === "Yes" ||
        (!fields.hasDeposit && Boolean(fields.deposit?.trim()))
    );
    }
    if (key === "visaSubclass") {
        return fields.residency === "Visa Holder";
        }
    if (["previousAddress", "previousMonths"].includes(key)) {
      return (
        fields.monthsAtAddress !== "" &&
        Number(fields.monthsAtAddress) < 36
      );
    }

    if (
      [
        "employer",
        "employerPhone",
        "jobTitle",
        "monthsInRole",
      ].includes(key)
    ) {
      return isEmployed;
    }

    if (key === "previousEmployer") {
        const isShortTermPartTimeOrCasual =
            ["Part Time", "Casual"].includes(fields.employment) &&
            fields.monthsInRole?.trim() !== "" &&
            Number(fields.monthsInRole) < 3;

        // Keep historical answers visible for legacy applications.
        return (
            isShortTermPartTimeOrCasual ||
            Boolean(initialFields.previousEmployer?.trim())
        );
    }

    if (key === "otherIncomeSource") {
        return Number(fields.otherIncome) > 0;
        }

        return true;
    }

    async function save() {
        setError("");
            if (fields.hasLoans === "No" && liabilities.length > 0) {
                setError(
                    "You selected No for existing loans, but loan details are still recorded. Remove the loans first or select Yes."
                );
                return;
            }

 
    if (
        fields.residency === "Visa Holder" &&
        !/^\d{3,4}$/.test((fields.visaSubclass ?? "").trim())
        ) {
        setError("Please enter a valid 3–4 digit visa subclass number.");
        return;
    }

    if (!brokerName.trim()) {
      setError("Please enter your broker name.");
      return;
    }

    if (!authorityConfirmed) {
      setError(
        "Please confirm you hold the customer's authority before saving."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/broker/applications/${encodeURIComponent(applicationId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields,
            liabilities,
            brokerName: brokerName.trim(),
            authorityConfirmed,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save application changes."
        );
      }

      setOpen(false);
      setAuthorityConfirmed(false);
      setBrokerName("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#41424d] bg-[#22232b] px-3 py-3 text-sm text-white outline-none transition focus:border-pink-500";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/60 px-4 py-2.5 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/10"
      >
        <Pencil size={16} />
        Edit Details
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit finance application"
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#41424d] bg-[#15161d] text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#34353d] p-6">
              <div>
                <h2 className="text-xl font-bold">
                  EDIT APPLICATION
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Correct or update the applicant's details.
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {customerName}
                </p>

                <p className="mt-1 break-all font-mono text-xs text-cyan-400">
                  {applicationId}
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#292a33]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 space-y-9 overflow-y-auto p-6">
              {groups.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-cyan-400">
                    {group.title}
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.fields
                      .filter(([key]) => shouldShowField(key))
                      .map(([key, label]) => (
                        <label key={key} className="block min-w-0">
                          <span className="text-xs font-medium text-gray-400">
                            {label}
                          </span>
                            {options[key]? (
                            <select
                              value={fields[key] ?? ""}
                              onChange={(e) =>
                                updateField(key, e.target.value)
                              }
                              className={inputClass}
                            >
                              <option value="">Select an option</option>
                              {options[key].map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                key === "dob"
                                  ? "date"
                                  : numberFields.has(key)
                                  ? "number"
                                  : key === "email"
                                  ? "email"
                                  : "text"
                              }
                              min={
                                numberFields.has(key)
                                  ? 0
                                  : undefined
                              }
                              value={fields[key] ?? ""}
                              onChange={(e) =>
                                updateField(key, e.target.value)
                              }
                              className={inputClass}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                </section>
            ))}

            
            {fields.hasLoans !== "No" && (
            <section className="border-t border-[#34353d] pt-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-400">
                    Existing Loan Details
                    </h3>
                    <p className="mt-2 text-xs text-gray-400">
                    Add or correct the applicant's existing loans.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addLoan}
                    className="rounded-lg border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10"
                >
                    + Add Loan
                </button>
                </div>

                {liabilities.length === 0 && (
                <p className="text-sm text-gray-500">
                    No loan details recorded.
                </p>
                )}

                <div className="space-y-4">
                {liabilities.map((loan, index) => (
                    <div
                    key={index}
                    className="rounded-xl border border-[#353640] bg-[#202127] p-4"
                    >
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-bold text-white">
                        Loan {index + 1}
                        </p>

                        <button
                        type="button"
                        onClick={() => removeLoan(index)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                        Remove
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {(
                        [
                            ["type", "Loan Type"],
                            ["description", "Lender Name"],
                            ["amount", "Outstanding Balance ($)"],
                            ["monthlyRepayment", "Monthly Repayment ($)"],
                        ] as const
                        ).map(([key, label]) => (
                        <label key={key} className="block min-w-0">
                            <span className="text-xs font-medium text-gray-400">
                            {label}
                            </span>

                            <input
                            type={
                                key === "amount" ||
                                key === "monthlyRepayment"
                                ? "number"
                                : "text"
                            }
                            min={
                                key === "amount" ||
                                key === "monthlyRepayment"
                                ? 0
                                : undefined
                            }
                            step={
                                key === "amount" ||
                                key === "monthlyRepayment"
                                ? "0.01"
                                : undefined
                            }
                            value={loan[key] ?? ""}
                            onChange={(event) =>
                                updateLoan(index, key, event.target.value)
                            }
                            className={inputClass}
                            />
                        </label>
                        ))}
                    </div>
                    </div>
                ))}
                </div>
            </section>
            )}

            {/* Broker Authority Attestation */}
            <section className="border-t border-[#34353d] pt-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-r from-pink-600 to-cyan-400 p-3">
                    <ShieldCheck size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                      Final Section
                    </p>
                    <h3 className="text-xl font-bold text-white">
                      Broker Authority Attestation
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Confirm you have the customer's authority
                      to update this application.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-5">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-200">
                      Full Name *
                    </span>
                    <input
                      value={brokerName}
                      onChange={(e) => {
                        setBrokerName(e.target.value);
                        setAuthorityConfirmed(false);
                      }}
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </label>

                  <p className="mt-5 text-sm leading-7 text-gray-300">
                    I,{" "}
                    <strong>
                      {brokerName.trim() || "[Broker Name]"}
                    </strong>
                    , confirm that I have the customer's authority
                    to update this finance application on their
                    behalf.
                  </p>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#45404c] bg-[#111116] p-4">
                    <input
                      type="checkbox"
                      checked={authorityConfirmed}
                      onChange={(e) =>
                        setAuthorityConfirmed(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-pink-500"
                    />

                    <span className="text-sm font-semibold text-gray-200">
                      I confirm I hold the customer's authority to
                      update this application.
                    </span>
                  </label>
                </div>
              </section>

              <p className="rounded-lg border border-[#44404b] p-4 text-xs leading-6 text-gray-400">
                The customer's original submitted timestamp,
                consent and electronic signature are not changed
                by editing application details.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-[#34353d] bg-[#1b1c24] p-5">
              {error && (
                <p
                  role="alert"
                  className="mb-3 text-sm text-red-400"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="rounded-lg border border-[#444550] px-5 py-3 text-sm font-medium text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !authorityConfirmed || !brokerName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-600 to-cyan-400 px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
