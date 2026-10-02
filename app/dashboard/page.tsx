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

  activity: {
    all: {
      contacted: number;
      contractSigned: number;
      won: number;
      delivered: number;
      lost: number;
    };

    me: {
      contacted: number;
      contractSigned: number;
      won: number;
      delivered: number;
      lost: number;
    };
  };
};

export default function DashboardPage() {
  const todayInPerth = new Date(
  new Date().toLocaleString("en-US", {
    timeZone: "Australia/Perth",
  })
);

  const [selectedDate, setSelectedDate] = useState(todayInPerth);

  const [data, setData] = useState<DashboardData | null>(null);

  const [activityScope, setActivityScope] =
    useState<"all" | "me">("all");

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

  const activity =
    activityScope === "all"
      ? data?.activity.all
      : data?.activity.me;

  useEffect(() => {
    async function loadDashboard() {
      const result = await getDailyInsights(databaseDate);
      setData(result);
    }

    loadDashboard();
  }, [databaseDate]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Daily Insights
          </h1>

          <p className="mt-1 text-gray-600">
            What's on today?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={previousDay}
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-white text-xl hover:bg-gray-100"
          >
            ‹
          </button>

          <h2 className="min-w-[240px] text-center text-lg font-semibold">
            {formattedDate}
          </h2>

          <button
            onClick={nextDay}
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-white text-xl hover:bg-gray-100"
          >
            ›
          </button>
        </div>
      </div>

      {!data ? (
        <p className="mt-8 text-gray-500">
          Loading insights...
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.85fr_1fr]">

            {/* LEFT SIDE */}
            <div className="space-y-6">

              {/* BY ALL + BY ME */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* BY ALL */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">
                    By All
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Leads Created
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.all.leadsCreated}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Leads Contacted
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.all.leadsContacted}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Uncontacted Leads
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.all.uncontacted}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Hot Not Contacted
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.all.hotUncontacted}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BY ME */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">
                    By Me
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Leads Created
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.me.leadsCreated}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Leads Contacted
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.me.leadsContacted}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Uncontacted Leads
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.me.uncontacted}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Hot Not Contacted
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {data.me.hotUncontacted}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TODAY'S SALES ACTIVITY */}
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Today's Sales Activity
                  </h2>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActivityScope("all")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        activityScope === "all"
                          ? "bg-black text-white"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      By All
                    </button>

                    <button
                      onClick={() => setActivityScope("me")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        activityScope === "me"
                          ? "bg-black text-white"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      By Me
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Contacted</p>
                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contacted}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Contract Signed
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contractSigned}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Won</p>
                    <p className="mt-1 text-2xl font-bold">
                      {activity?.won}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Delivered
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {activity?.delivered}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Lost</p>
                    <p className="mt-1 text-2xl font-bold">
                      {activity?.lost}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Hot Leads Not Contacted
                </h2>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                  {data.hotLeadsNotContacted.length}
                </span>
              </div>

              {data.hotLeadsNotContacted.length === 0 ? (
                <p className="text-sm text-gray-500">
                  All hot leads were contacted.
                </p>
              ) : (
                <div className="max-h-[220px] overflow-y-auto pr-2">
                  <div className="divide-y">
                    {data.hotLeadsNotContacted.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="font-medium">
                          {lead.name}
                        </span>

                        <span className="text-sm text-gray-500">
                          CP: {lead.salesperson?.name ?? "Unassigned"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}