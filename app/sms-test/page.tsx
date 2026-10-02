"use client";

import { useState } from "react";

export default function SmsTestPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [sending, setSending] = useState(false);

  const message = `Hi ${name || "there"}, it's the team at Carmart Perth.

You can complete your vehicle finance application here:
https://www.carmartperth.com.au/finance`;

  function formatAustralianMobile(phone: string) {
    const cleaned = phone.replace(/\s+/g, "");

    // 04xxxxxxxx -> +614xxxxxxxx
    if (/^04\d{8}$/.test(cleaned)) {
      return `+61${cleaned.slice(1)}`;
    }

    // Already in +614xxxxxxxx format
    if (/^\+614\d{8}$/.test(cleaned)) {
      return cleaned;
    }

    throw new Error(
      "Enter a valid Australian mobile number, e.g. 0424165062"
    );
  }

  async function handleSend() {
    try {
      setSending(true);

      const formattedMobile = formatAustralianMobile(mobile);

      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formattedMobile,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "SMS failed");
      }

      alert(
        `SMS sent successfully\nSID: ${data.sid}\nStatus: ${data.status}`
      );
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Something went wrong");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">SMS Test</h1>

        <p className="mt-1 text-gray-600">
          Test the automated finance SMS flow.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block font-medium">
              Customer name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apolos"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              Mobile number
            </label>

            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="0424 165 062"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">
              Message preview
            </label>

            <textarea
              value={message}
              readOnly
              rows={6}
              className="w-full rounded-lg border bg-gray-50 p-3"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-lg bg-black p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Test SMS"}
          </button>
        </div>
      </div>
    </main>
  );
}