"use client";

import { useEffect, useState } from "react";
import { getDailyInsights } from "@/app/actions/getDailyInsights";

type DashboardData = {
  all: {
    leadsCreated: number;
    leadsContacted: number;
    uncontacted: number;
    hotUncontacted: number;
  };

  me: {
    leadsCreated: number;
    leadsContacted: number;
    uncontacted: number;
    hotUncontacted: number;
  };

  hotLeadsNotContacted: {
    id: number;
    name: string;
    salesperson: {
      name: string;
    } |null;
    lastContactedAt: Date | null;
  }[];
};

export default function DashboardPage() {
  const todayInPerth = new Date(
  new Date().toLocaleString("en-US", {
    timeZone: "Australia/Perth",
  })
);

const [selectedDate, setSelectedDate] = useState(todayInPerth);

  const [data, setData] = useState<DashboardData | null>(null);

  const previousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const formattedDate = selectedDate.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const databaseDate =
    selectedDate.getFullYear() +
    "-" +
    String(selectedDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(selectedDate.getDate()).padStart(2, "0");

  useEffect(() => {
    async function loadDashboard() {
      const result = await getDailyInsights(databaseDate);
      setData(result);
    }

    loadDashboard();
  }, [databaseDate]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold">
        Daily Insights
      </h1>

      {/* DATE NAVIGATION */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={previousDay}
          className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-2xl hover:bg-gray-100"
        >
          ‹
        </button>

        <div className="min-w-[320px] text-center">
          <h2 className="text-xl font-semibold">
            {formattedDate}
          </h2>
        </div>

        <button
          onClick={nextDay}
          className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-2xl hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      {!data ? (
        <p className="mt-8 text-gray-500">
          Loading insights...
        </p>
      ) : (
        <>
          {/* TOP CARDS */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* BY ALL */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold">
                By All
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Leads Created
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.all.leadsCreated}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Leads Contacted
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.all.leadsContacted}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Uncontacted Leads
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.all.uncontacted}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Uncontacted Leads
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.all.hotUncontacted}
                  </p>
                </div>

              </div>
            </div>

            {/* BY ME */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold">
                By Me
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Leads Created
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.me.leadsCreated}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Leads Contacted
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.me.leadsContacted}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Uncontacted Leads
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.me.uncontacted}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Uncontacted Leads
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {data.me.hotUncontacted}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* HOT LEADS */}
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Hot Leads Not Contacted
              </h2>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {data.hotLeadsNotContacted.length}
              </span>
            </div>

            {data.hotLeadsNotContacted.length === 0 ? (
              <p className="text-gray-500">
                All hot leads were contacted on this date.
              </p>
            ) : (
              <div>
                {data.hotLeadsNotContacted.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between border-b py-4 last:border-b-0"
                  >
                    <span className="font-medium">
                      {lead.name}
                    </span>

                    <span className="text-sm text-gray-500">
                      CP:{" "}
                      {lead.salesperson?.name ?? "Unassigned"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}