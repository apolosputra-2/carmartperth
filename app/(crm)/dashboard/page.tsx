"use client";

import { useEffect, useState } from "react";
import { getInsights } from "@/app/actions/getInsights";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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
    phone: string | null;
    salespersonId: number | null;
    salesperson: {
      name: string;
    } |null;
    lastContactedAt: Date | null;
  }[];

  activity: {
    all: {
      contacted: number;
      contactSuccessful: number;
      contactUnsuccessful: number;
      contractSigned: number;
      won: number;
      delivered: number;
      lost: number;
    };

    me: {
      contacted: number;
      contactSuccessful: number;
      contactUnsuccessful: number;
      contractSigned: number;
      won: number;
      delivered: number;
      lost: number;
    };
  };

  graph: {
    all: {
      label: string;
      contacted: number;
      contactSuccessful: number;
      contactUnsuccessful: number;
    }[];

    me: {
      label: string;
      contacted: number;
      contactSuccessful: number;
      contactUnsuccessful: number;
    }[];
  };
};

export default function DashboardPage() {
  const todayInPerth = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Australia/Perth",
    })
  );

  const [insightRange, setInsightRange] =
  useState<"today" | "week" | "month">("today");

  const [selectedDate, setSelectedDate] = useState(todayInPerth);

  const [data, setData] = useState<DashboardData | null>(null);

  const [activityScope, setActivityScope] =
    useState<"all" | "me">("all");

  const [hotLeadScope, setHotLeadScope] =
    useState<"all" | "me">("all");

  const [leadScope, setLeadScope] =
    useState<"all" | "me">("all");

  const [visibleGraphSeries, setVisibleGraphSeries] = useState({
    contacted: true,
    contactSuccessful: true,
    contactUnsuccessful: true,
  });

  const currentSalespersonId = 4;

  function toggleGraphSeries(
    key: keyof typeof visibleGraphSeries
  ) {
    setVisibleGraphSeries((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  const insightSubtitle =
    insightRange === "today"
      ? "What's on today?"
      : insightRange === "week"
        ? "This week's performance"
        : "This month's performance";

  const visibleHotLeads =
  hotLeadScope === "all"
    ? data?.hotLeadsNotContacted ?? []
    : (data?.hotLeadsNotContacted ?? []).filter(
        (lead) => lead.salespersonId === currentSalespersonId
      );

  const previousPeriod = () => {
    const newDate = new Date(selectedDate);

    if (insightRange === "today") {
      newDate.setDate(newDate.getDate() - 1);
    }

    if (insightRange === "week") {
      newDate.setDate(newDate.getDate() - 7);
    }

    if (insightRange === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    setSelectedDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(selectedDate);

    if (insightRange === "today") {
      newDate.setDate(newDate.getDate() + 1);
    }

    if (insightRange === "week") {
      newDate.setDate(newDate.getDate() + 7);
    }

    if (insightRange === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setSelectedDate(newDate);
  };

  let formattedDate = "";

  if (insightRange === "today") {
    formattedDate = selectedDate.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (insightRange === "week") {
    const startOfWeek = new Date(selectedDate);

    const day = startOfWeek.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startLabel = startOfWeek.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });

    const endLabel = endOfWeek.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    formattedDate = `${startLabel} – ${endLabel}`;
  }

  if (insightRange === "month") {
    formattedDate = selectedDate.toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  }

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

  const graphData =
  activityScope === "all"
    ? data?.graph.all ?? []
    : data?.graph.me ?? [];

  const leadOverview =
    leadScope === "all"
      ? data?.all
      : data?.me;

  useEffect(() => {
    async function loadDashboard() {
      const result = await getInsights(databaseDate, insightRange);
      setData(result);
    }

    loadDashboard();
  }, [databaseDate, insightRange]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Daily Insights
          </h1>

          <p className="mt-1 text-gray-600">
            {insightSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            {/* RANGE SWITCHER */}
            <div className="flex rounded-xl border bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setInsightRange("today")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  insightRange === "today"
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setInsightRange("week")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  insightRange === "week"
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                This Week
              </button>

              <button
                type="button"
                onClick={() => setInsightRange("month")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  insightRange === "month"
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                This Month
              </button>
            </div>

            {/* DATE NAVIGATION */}
            <div className="flex items-center rounded-xl border bg-white shadow-sm">
              <button
                type="button"
                onClick={previousPeriod}
                className="flex h-10 w-10 items-center justify-center rounded-l-xl text-xl text-gray-600 hover:bg-gray-100"
              >
                ‹
              </button>

              <div className="min-w-[230px] border-x px-5 text-center">
                <p className="text-sm font-semibold">
                  {formattedDate}
                </p>
              </div>

              <button
                type="button"
                onClick={nextPeriod}
                className="flex h-10 w-10 items-center justify-center rounded-r-xl text-xl text-gray-600 hover:bg-gray-100"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {!data ? (
        <p className="mt-8 text-gray-500">
          Loading insights...
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">

            {/* LEFT SIDE */}
            <div className="space-y-6">

              {/* BY ALL + BY ME */}
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Lead Overview
                  </h2>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLeadScope("all")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        leadScope === "all"
                          ? "bg-black text-white"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      By All
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeadScope("me")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        leadScope === "me"
                          ? "bg-black text-white"
                          : "border bg-white text-gray-700"
                      }`}
                    >
                      By Me
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Leads Created
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {leadOverview?.leadsCreated ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Leads Contacted
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {leadOverview?.leadsContacted ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Uncontacted Leads
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {leadOverview?.uncontacted ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Hot Not Contacted
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {leadOverview?.hotUncontacted ?? 0}
                    </p>
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

                {/* CONTACT ACTIVITY */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Contacted
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contacted ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Contact Successful
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contactSuccessful ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Contact Unsuccessful
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contactUnsuccessful ?? 0}
                    </p>
                  </div>
                </div>

                {/* SALES OUTCOMES */}
                <div className="mt-3 grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Contract Signed
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.contractSigned ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Won
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.won ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Delivered
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.delivered ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Lost
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {activity?.lost ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SALES ACTIVITY GRAPH */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  Contact Activity
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {insightRange === "today"
                    ? "Successful vs unsuccessful contacts throughout the day"
                    : insightRange === "week"
                      ? "Successful vs unsuccessful contacts throughout the week"
                      : "Successful vs unsuccessful contacts throughout the month"}
                </p>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={graphData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: -10,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={insightRange === "week" ? 0 : 2}
                      tickMargin={8}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      width={30}
                    />

                    <Tooltip />

                    <Legend
                      verticalAlign="bottom"
                      height={36}
                    />

                    {visibleGraphSeries.contacted && (
                      <Line
                        type="monotone"
                        dataKey="contacted"
                        name="Contacted"
                        stroke="#111827"
                        strokeWidth={3}
                        dot={false}
                      />
                    )}

                    {visibleGraphSeries.contactSuccessful && (
                      <Line
                        type="monotone"
                        dataKey="contactSuccessful"
                        name="Successful"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}

                    {visibleGraphSeries.contactUnsuccessful && (
                      <Line
                        type="monotone"
                        dataKey="contactUnsuccessful"
                        name="Unsuccessful"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleGraphSeries.contacted}
                    onChange={() => toggleGraphSeries("contacted")}
                  />
                  Contacted
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleGraphSeries.contactSuccessful}
                    onChange={() => toggleGraphSeries("contactSuccessful")}
                  />
                  Successful
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleGraphSeries.contactUnsuccessful}
                    onChange={() => toggleGraphSeries("contactUnsuccessful")}
                  />
                  Unsuccessful
                </label>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Hot Leads Not Contacted
                  </h2>

                  <p className="text-sm text-gray-500">
                    Today
                  </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHotLeadScope("all")}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          hotLeadScope === "all"
                            ? "border-black bg-black text-white"
                            : "border-gray-400 bg-white text-gray-700"
                        }`}
                      >
                        By All
                      </button>

                      <button
                        type="button"
                        onClick={() => setHotLeadScope("me")}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          hotLeadScope === "me"
                            ? "border-black bg-black text-white"
                            : "border-gray-400 bg-white text-gray-700"
                        }`}
                      >
                        By Me
                      </button>
                    </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {visibleHotLeads.length}
                  </span>
                </div>
              </div>

              {visibleHotLeads.length === 0 ? (
                <p className="text-sm text-gray-500">
                  All hot leads were contacted.
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {visibleHotLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {lead.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {lead.phone ?? "No phone number"}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xs text-gray-400">
                              Salesperson
                            </p>

                            <p className="text-sm font-medium text-gray-600">
                              {lead.salesperson?.name ?? "Unassigned"}
                            </p>
                          </div>
                        </div>
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