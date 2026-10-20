
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save, ShieldCheck } from "lucide-react";

type EditApplicationModalProps = {
  applicationId: string;
  customerName: string;
  initialFields: Record<string, string>;
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
      ["previousAddress", "Previous Address"],
      ["previousMonths", "Time at Previous Address (months)"],
      ["livingSituation", "Living Situation"],
      ["rent", "Housing Cost ($/month)"],
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
      ["previousEmployer", "Previous Employer"],
      ["income", "Net Monthly Income ($)"],
      ["otherIncome", "Other Income ($/month)"],
      ["otherIncomeSource", "Other Income Source"],
    ],
  },
  {
    title: "Financial Position",
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
    ],
  },
  {
    title: "Loan Information",
    fields: [
      ["loanAmount", "Requested Loan ($)"],
      ["weeklyBudget", "Weekly Payment Budget ($)"],
      ["deposit", "Deposit / Trade-in ($)"],
      ["vehicle", "Vehicle"],
      ["creditHistory", "Credit History"],
      ["additionalNotes", "Additional Notes"],
    ],
  },
] as const;

const options: Record<string, string[]> = {
  residency: [
    "Australian Citizen",
    "Permanent Resident",
    "Temporary Resident",
    "Other",
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
}: EditApplicationModalProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(initialFields);
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
    }));
  }

  function close() {
    if (saving) return;

    setOpen(false);
    setFields(initialFields);
    setBrokerName("");
    setAuthorityConfirmed(false);
    setError("");
  }

  function shouldShowField(key: string) {
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
      return (
        isEmployed &&
        fields.monthsInRole !== "" &&
        Number(fields.monthsInRole) < 3
      );
    }

    if (key === "otherIncomeSource") {
      return Number(fields.otherIncome) > 0;
    }

    return true;
  }

  async function save() {
    setError("");

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

                          {key === "additionalNotes" ? (
                            <textarea
                              rows={3}
                              value={fields[key] ?? ""}
                              onChange={(e) =>
                                updateField(key, e.target.value)
                              }
                              className={inputClass}
                            />
                          ) : options[key] ? (
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
