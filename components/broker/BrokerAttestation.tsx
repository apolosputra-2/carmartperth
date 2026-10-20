
"use client";

import { ShieldCheck } from "lucide-react";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  brokerName: string;
};

export default function BrokerAttestation({
  checked,
  onChange,
  brokerName,
}: Props) {
  return (
    <section className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-5">
      <div className="mb-4 flex items-center gap-3">
        <ShieldCheck size={22} className="text-pink-400" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Broker Submission
          </p>
          <h3 className="text-lg font-bold text-white">
            Broker Authority Attestation
          </h3>
        </div>
      </div>

      <p className="text-sm leading-6 text-gray-300">
        I, <strong>{brokerName || "[Broker Name]"}</strong>,
        confirm that I have the customer's authority to
        {` submit or update this finance application on their behalf.`}
      </p>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#45404c] bg-[#111116] p-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 accent-pink-500"
        />

        <span className="text-sm font-semibold text-gray-200">
          I confirm I hold the customer's authority to submit
          or update this application.
        </span>
      </label>
    </section>
  );
}
