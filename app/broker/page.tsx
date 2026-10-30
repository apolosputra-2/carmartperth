
"use client";


import AssignmentModal from "@/components/broker/AssignmentModal";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
    Search,
    Send,
    X,
    LogOut,
    Folder,
    FolderOpen,
    BriefcaseBusiness,
    ChevronRight,
    ChevronDown,
    FileText,
    UserRound,
    Phone,
    Clock3,
    CheckCircle2,
    ClipboardList,
    BarChart3,
    Users,
    Plus,
    ArrowUpRight,
} from "lucide-react";

type ApplicationStatus =
    | "Received"
    | "Sent To Broker"
    | "Under Review"
    | "Additional Info Required"
    | "Sent To Lender"
    | "Conditionally Approved"
    | "Approved"
    | "Declined"
    | "Settled";


type Application = {
    id: string;
    inquiryNumber: number;
    name: string;
    phone: string;
    email?: string;
    employmentType: string;
    amount: number;
    weeklyBudget?: number | null;
    vehicle: string;
    status: ApplicationStatus;
    submitted: string;
    assignedStaffName?: string | null;
    assignedStaffId?: string | null;
    assignedBrokerName?: string | null;
    assignedBrokerId?: string | null;
    consentComplete?: boolean;
    documentCount?: number;
    folderName?: string;
};

const statusColors: Record<ApplicationStatus, string> = {
    Received:
    "border-slate-500/40 bg-slate-500/10 text-slate-300",

    "Sent To Broker":
    "border-blue-500/40 bg-blue-500/10 text-blue-400",

    "Under Review":
    "border-blue-500/40 bg-blue-500/10 text-blue-400",

    "Additional Info Required":
    "border-amber-500/40 bg-amber-500/10 text-amber-400",

    "Sent To Lender":
    "border-blue-500/40 bg-blue-500/10 text-blue-400",

    "Conditionally Approved":
    "border-amber-500/40 bg-amber-500/10 text-amber-400",

    Approved:
    "border-green-500/40 bg-green-500/10 text-green-400",

    Declined:
    "border-red-500/40 bg-red-500/10 text-red-400",

    Settled:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

function formatInquiryNumber(number: number) {
    const prefix = String(Math.floor(number / 1000)).padStart(3, "0");
    const suffix = String(number % 1000).padStart(3, "0");

    return `INQ-${prefix}-${suffix}`;
}

function money(amount: number) {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(value: string) {
    if (!value) return "—";

const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

return date.toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    });
}

export default function BrokerPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [assignmentModal, setAssignmentModal] = useState<{

    applicationId: string;
    applicantName: string;
    assignedStaffName?: string | null;
    assignedBrokerName?: string | null;
    type: "staff" | "broker";
    } | null>(null);

    const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: "STAFF" | "BOSS" | "BROKER";
    } | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadCurrentUser() {

    try {
    const response = await fetch("/api/broker/me", {
        cache: "no-store",
});

if (!response.ok) {
    throw new Error("Unable to load current user");
}

const user = await response.json();

if (!cancelled) {
    setCurrentUser(user);
}
} catch (error) {
console.error("Current user loading error:", error);
}
}

loadCurrentUser();

return () => {
    cancelled = true;
    };
}, []);

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All statuses");
const [staffFilter, setStaffFilter] = useState("all");
const [brokerFilter, setBrokerFilter] = useState("all");
const [employmentFilter, setEmploymentFilter] = useState("all");
const [applicationFilter, setApplicationFilter] = useState("all");
const [documentFilter, setDocumentFilter] = useState("all");
const [activeFolder, setActiveFolder] = useState("All Applications");
const [staffView, setStaffView] = useState<"mine" | "all">("mine");

const [showSMS, setShowSMS] = useState(false);
const [selected, setSelected] = useState<Application | null>(null);
const [customerName, setCustomerName] = useState("");
const [phone, setPhone] = useState("");

const [staffOptions, setStaffOptions] = useState<
{
id: string;
name: string;
email?: string | null;
}[]
>([]);

const [brokerOptions, setBrokerOptions] = useState<
{
id: string;
name: string;
email?: string | null;
phone?: string | null;
}[]
>([]);


useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === "BROKER") {
    setStaffOptions([]);
    setBrokerOptions([]);
return;
}

let cancelled = false;

async function loadPortalUsers() {
try {
const response = await fetch(
    "/api/broker/portal-users",
    { cache: "no-store" }
);

if (!response.ok) {
    throw new Error(
    `Unable to load portal users (${response.status})`
    );
}

const data = await response.json();

if (!cancelled) {
    setStaffOptions(data.staff ?? []);
    setBrokerOptions(data.brokers ?? []);
}
} catch (error) {
if (!cancelled) {
    console.error("Portal users loading error:", error);
}
}
}

loadPortalUsers();

return () => {
cancelled = true;
};
}, [currentUser?.id, currentUser?.role]);

const [showAnalytics, setShowAnalytics] = useState(true);
const [showUnassigned, setShowUnassigned] = useState(true);
const [showCurrent, setShowCurrent] = useState(true);

useEffect(() => {
    let active = true;
    let accessDenied = false;

async function loadApplications() {
try {
const response = await fetch(
    `/api/broker/applications?view=${staffView}`,
    {
        cache: "no-store",
    }
);


if (response.status === 401 || response.status === 403) {
    accessDenied = true;

  if (active) {
    setApplications([]);
    setCurrentUser(null);
    setStaffOptions([]);
    setBrokerOptions([]);
    setSelected(null);
    setAssignmentModal(null);
  }

  window.location.replace("/login");
  return;
}

if (!response.ok) {
  throw new Error("Unable to load finance applications.");
}


const result = await response.json();

if (active) {
setApplications(
    Array.isArray(result.applications)
    ? result.applications
    : []
);
setLoadError("");
}
} catch (error) {
if (active) {
setLoadError(
    error instanceof Error
    ? error.message
    : "Unable to load applications."
);
}
} finally {
if (active) setLoading(false);
}
}

loadApplications();

const interval = window.setInterval(() => {
    if (
        active &&
        !accessDenied &&
        document.visibilityState === "visible"
    ) {
        loadApplications();
    }
}, 15000);

return () => {
  active = false;
  window.clearInterval(interval);
};
}, [staffView]);

const filtered = useMemo(() => {
const term = search.trim().toLowerCase();

return applications.filter((application) => {
    const matchesSearch =
        !term ||
        [
            application.name,
            application.phone,
            application.id,
            formatInquiryNumber(application.inquiryNumber),
            application.vehicle,
        ].some((value) =>
            String(value ?? "").toLowerCase().includes(term)
        );


    const matchesStatus =
    statusFilter === "All statuses" ||
    application.status === statusFilter;

    const matchesFolder =
    activeFolder === "All Applications" ||
    (activeFolder === "Unfiled"
    ? !application.assignedBrokerId
    : application.assignedBrokerId === activeFolder);

    const matchesStaff =
    staffFilter === "all" ||
    (staffFilter === "unassigned"
    ? !application.assignedStaffId
    : application.assignedStaffId === staffFilter);

    const matchesBroker =
    brokerFilter === "all" ||
    (brokerFilter === "unassigned"
    ? !application.assignedBrokerId
    : application.assignedBrokerId === brokerFilter);

    const matchesEmployment =
    employmentFilter === "all" ||
    application.employmentType === employmentFilter;

    const matchesApplication =
    applicationFilter === "all" ||
    (applicationFilter === "assigned"
    ? Boolean(application.assignedStaffId)
    : !application.assignedStaffId);

    const matchesDocuments =
    documentFilter === "all" ||
    (documentFilter === "with"
    ? (application.documentCount ?? 0) > 0
    : (application.documentCount ?? 0) === 0);

    return (
    matchesSearch &&
    matchesStatus &&
    matchesFolder &&
    matchesStaff &&
    matchesBroker &&
    matchesEmployment &&
    matchesApplication &&
    matchesDocuments
    );
    });
    }, [
    applications,
    search,
    statusFilter,
    activeFolder,
    staffFilter,
    brokerFilter,
    employmentFilter,
    applicationFilter,
    documentFilter,
    ]);

    const unassignedApplications = useMemo(
        () =>
            currentUser?.role === "BROKER"
            ? []
            : filtered.filter(
                (application) => !application.assignedBrokerId
                ),
        [filtered, currentUser?.role]
    );

    const currentApplications = useMemo(() => {
        return filtered.filter((application) => {
            if (currentUser?.role === "BROKER") {
            return true;
    }

    // Unassigned applications have their own section.
    if (!application.assignedBrokerId) {
        return false;
        }

    if (currentUser?.role === "BOSS") {
        return true;
        }

    if (currentUser?.role === "STAFF") {
        return (
            staffView === "all" ||
            application.assignedStaffId === currentUser.id
        );
    }

    return false;
    });
    }, [filtered, currentUser?.role, currentUser?.id, staffView]);

    const stats = [
    {
    label: "TOTAL APPLICATIONS",
    value: applications.length,
    color: "text-white",
    },
    {
    label: "SUBMITTED",
    value: applications.filter((a) => a.status === "Received").length,
    color: "text-cyan-400",
    },
    {
    label: "UNDER REVIEW",
    value: applications.filter((a) => a.status === "Under Review").length,
    color: "text-amber-400",
    },
    {
    label: "APPROVED",
    value: applications.filter((a) => a.status === "Approved").length,
    color: "text-emerald-400",
    },
];

const inputStyle =
"w-full rounded-lg border border-[#34343e] bg-[#111116] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-cyan-500";

// One shared card renderer for both application sections.

function renderApplicationCards(list: Application[]) {
return (
<div className="space-y-3">
    {list.map((application) => {
    const isEmployed = [
        "Full Time",
        "Part Time",
        "Casual",
        "Self Employed",
        "Contract",
    ].includes(application.employmentType);

    const isUnemployed = [
        "Unemployed",
        "Centrelink",
    ].includes(application.employmentType);

    const canAssignStaff =
        currentUser?.role === "BOSS" ||
        (currentUser?.role === "STAFF" &&
        !application.assignedStaffId);

    const canAssignBroker =
        currentUser?.role === "BOSS" ||
        currentUser?.role === "STAFF";

    const openApplication = () => {
        window.location.href =
        `/broker/applications/${application.id}`;
    };

    return (
        <article
        key={application.id}
        className="overflow-hidden rounded-xl border border-[#353741] bg-[#202127] transition-all duration-200 hover:border-[#4b5868] hover:bg-[#23252d] hover:shadow-[0_4px_18px_rgba(0,0,0,0.18)]"
        >
        <div className="flex flex-col xl:flex-row">
            {/* Main content */}
            <div className="min-w-0 flex-1 px-5 py-4">
            <div className="grid items-center gap-4 pt-2 sm:grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)_minmax(0,1fr)]">                  {/* Application ID */}
                <div>
                <span className="font-mono text-[11px] font-medium text-cyan-400">
                    {formatInquiryNumber(application.inquiryNumber)}
                </span>
                </div>

                {/* Applicant */}
                <div className="min-w-0">
                <button
                    type="button"
                    onClick={openApplication}
                    className="max-w-full text-left"
                >
                    <h3 className="truncate text-[15px] font-semibold text-white hover:text-cyan-300">
                    {application.name}
                    </h3>
                </button>

                <p className="mt-1 truncate text-[11px] text-gray-400">
                    {application.email
                    ? `${application.email} · ${application.phone}`
                    : application.phone}
                </p>
                </div>

                {/* Finance */}
                <div className="min-w-0">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Loan Amount
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-white">
                        {money(application.amount)}
                    </p>
                    </div>

                    <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Weekly Budget
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-cyan-400">
                        {application.weeklyBudget != null &&
                        application.weeklyBudget > 0
                        ? `${money(application.weeklyBudget)}/wk`
                        : "—"}
                    </p>
                    </div>
                </div>

                <p className="mt-1.5 truncate text-[11px] text-gray-400">
                    {application.vehicle || "Vehicle not selected"}
                </p>
                </div>
            </div>

                {/* Compact metadata row */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#30323a] pt-3">

                    {(isEmployed || isUnemployed) && (
                    <span
                        className={`inline-flex h-5 items-center justify-center rounded-md border px-2 text-[9px] leading-none font-bold uppercase tracking-wide ${
                        isEmployed
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        }`}
                    >
                        {isEmployed ? "Employed" : "Unemployed"}
                    </span>
                )}



                <div className="flex flex-col gap-1">
                    {/* Staff — Amber */}
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
                        <Users size={12} />
                        {application.assignedStaffName || "Staff unassigned"}
                    </span>

                    {/* Broker — Cyan */}
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-400">
                        <UserRound size={12} />
                        {application.assignedBrokerName || "Broker unassigned"}
                    </span>
                </div>

                {application.documentCount != null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <FileText size={13} />
                    {application.documentCount}
                </span>
                )}

                <span
                className={`inline-flex h-5 items-center justify-center rounded-full border px-2.5 text-[9px] leading-none font-semibold uppercase tracking-wide ${
                    statusColors[application.status] ??
                    "border-gray-600 text-gray-300"
                }`}
                >
                {application.status}
                </span>

                <span className="whitespace-nowrap text-[11px] text-gray-500">
                {formatDate(application.submitted)}
                </span>

                {application.consentComplete != null && (
                <span className="text-[11px] text-gray-400">
                    Consent:{" "}
                    <strong
                    className={
                        application.consentComplete
                        ? "font-medium text-emerald-400"
                        : "font-medium text-amber-400"
                    }
                    >
                    {application.consentComplete
                        ? "Complete"
                        : "Pending"}
                    </strong>
                </span>
                )}

                <button
                type="button"
                onClick={openApplication}
                className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-cyan-400 hover:text-cyan-200"
                >
                View Application
                <ChevronRight size={14} />
                </button>
            </div>
            </div>

            {/* Compact action panel */}
            <aside className="flex justify-between gap-3 border-t border-[#343640] bg-[#191b22] px-4 py-4 xl:w-[220px] xl:shrink-0 xl:flex-col xl:border-l xl:border-t-0">
            <div className="flex min-w-0 items-start gap-2">
                <Folder
                size={15}
                className="mt-0.5 shrink-0 text-gray-500"
                />
                <span className="truncate text-xs font-medium text-gray-300">
                {application.folderName || "Unfiled"}
                </span>
            </div>

            <div className="flex items-end gap-2">
                {canAssignStaff && (
                <button
                    type="button"
                    onClick={() =>
                    setAssignmentModal({
                        applicationId: application.id,
                        applicantName: application.name,
                        assignedStaffName:
                        application.assignedStaffName,
                        type: "staff",
                    })
                    }
                    className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#464954] px-3 py-2 text-[11px] font-medium text-gray-300 transition hover:border-[#666a77] hover:bg-[#2a2d36]"
                >
                    <Users size={13} />
                    Staff
                </button>
                )}

                {canAssignBroker && (
                <button
                    type="button"
                    onClick={() =>
                    setAssignmentModal({
                        applicationId: application.id,
                        applicantName: application.name,
                        assignedBrokerName:
                        application.assignedBrokerName,
                        type: "broker",
                    })
                    }
                    className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                    <UserRound size={13} />
                    Assign
                </button>
                )}

                {!canAssignStaff && !canAssignBroker && (
                <span className="text-[11px] text-gray-500">
                    View only
                </span>
                )}
            </div>
            </aside>
        </div>
        </article>
    );
    })}
</div>
);
}

return (
<main className="min-h-screen bg-[#090B12] text-[#F1F4FC]">

    {/* Header */}
    <div className="border-b border-[#2b2b35] bg-gradient-to-r from-[#220c20] via-[#171622] to-[#08242a] px-6 py-10 xl:px-10">
        <div
            className={
            currentUser?.role === "BROKER"
                ? "xl:ml-[100px]"
                : ""
            }
        >

    {/* Logged-in account */}
    {currentUser && (
    <div className="relative mb-5 flex justify-end">
        <div className="relative">
        <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-lg border border-[#41414c] bg-[#191a22]/80 px-4 py-2.5 text-left transition hover:border-cyan-500/50 hover:bg-[#252631]"
        >
            <UserRound size={20} className="text-cyan-400" />

            <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Logged in as
            </span>
            <span className="text-sm font-semibold text-white">
                {currentUser.name}
            </span>
            </div>

            <span
            className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${
                currentUser.role === "BOSS"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : currentUser.role === "BROKER"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
            }`}
            >
            {currentUser.role}
            </span>

            <ChevronDown
            size={15}
            className={`text-gray-500 transition-transform ${
                accountMenuOpen ? "rotate-180" : ""
            }`}
            />
        </button>

        {accountMenuOpen && (
            <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-full min-w-[180px] rounded-lg border border-[#41414c] bg-[#191a22] p-1 shadow-xl"
            >
            <button
                type="button"
                role="menuitem"

                onClick={async () => {
                    sessionStorage.removeItem("carmart-tab-login");
                    flushSync(() => {
                        setApplications([]);
                        setCurrentUser(null);
                        setStaffOptions([]);
                        setBrokerOptions([]);
                        setSelected(null);
                        setAssignmentModal(null);
                    });

                    await signOut({ redirectTo: "/login" });
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
                <LogOut size={16} />
                Logout
            </button>
            </div>
        )}
        </div>
    </div>
    )}

<div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
Broker Portal
</div>

    <h1 className="text-3xl font-black italic tracking-tight sm:text-4xl">
    LOAN APPLICATIONS
    </h1>

    <p className="mt-2 text-sm text-gray-400">
    Carmart Perth — Finance Application Management
    </p>



        {/* Filters */}
        <div className="mt-6 rounded-xl border border-[#343640] bg-[#15161c]/60 p-3">
            <div className="flex flex-wrap items-center gap-2.5">
            {/* Staff */}
            {currentUser?.role !== "BROKER" && (
            <select
                aria-label="Filter by staff"
                value={staffFilter}
                onChange={(e) => {
                setStaffFilter(e.target.value);

                if (
                    currentUser?.role === "STAFF" &&
                    e.target.value !== "all"
                ) {
                    setStaffView("all");
                }
                }}
                className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
                <option value="all">All staff</option>
                <option value="unassigned">Unassigned staff</option>
                {staffOptions.map((staff) => (
                <option key={staff.id} value={staff.id}>
                    {staff.name}
                </option>
                ))}
            </select>
            )}

            {/* Broker */}
            {currentUser?.role !== "BROKER" && (
            <select
                aria-label="Filter by broker"
                value={brokerFilter}
                onChange={(e) => setBrokerFilter(e.target.value)}
                className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
                <option value="all">All brokers</option>
                <option value="unassigned">Unassigned broker</option>
                {brokerOptions.map((broker) => (
                <option key={broker.id} value={broker.id}>
                    {broker.name}
                </option>
                ))}
            </select>
            )}

            {/* Status */}
            <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
            {[
                "All statuses",
                "Received",
                "Sent To Broker",
                "Under Review",
                "Additional Info Required",
                "Sent To Lender",
                "Conditionally Approved",
                "Approved",
                "Declined",
                "Settled",
            ].map((status) => (
                <option key={status} value={status}>
                {status}
                </option>
            ))}
            </select>

            {/* Employment */}
            <select
            aria-label="Filter by employment"
            value={employmentFilter}
            onChange={(e) => setEmploymentFilter(e.target.value)}
            className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
            <option value="all">All employment</option>
            {[
                "Full Time",
                "Part Time",
                "Casual",
                "Self Employed",
                "Contract",
                "Unemployed",
                "Retired",
                "Centrelink",
                "Other",
            ].map((employment) => (
                <option key={employment} value={employment}>
                {employment}
                </option>
            ))}
            </select>

            {/* Applications */}
            <select
            aria-label="Filter by applications"
            value={applicationFilter}
            onChange={(e) => setApplicationFilter(e.target.value)}
            className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
            <option value="all">All applications</option>
            <option value="assigned">Assigned staff</option>
            <option value="unassigned">Unassigned staff</option>
            </select>

            {/* Documents */}
            <select
            aria-label="Filter by documents"
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            className="h-10 min-w-[150px] flex-1 rounded-lg border border-[#3b3d47] bg-[#202127] px-3 text-xs text-gray-200 outline-none transition hover:border-[#555c69] focus:border-cyan-500"
            >
            <option value="all">Any documents</option>
            <option value="with">With documents</option>
            <option value="without">Without documents</option>
            </select>

            {/* Reset */}
            <button
            type="button"
            onClick={() => {
                setStaffFilter("all");
                setBrokerFilter("all");
                setStatusFilter("All statuses");
                setEmploymentFilter("all");
                setApplicationFilter("all");
                setDocumentFilter("all");
                setSearch("");
            }}
            className="h-10 rounded-lg border border-[#41444f] px-3 text-xs font-medium text-gray-300 transition hover:bg-[#272a33]"
            >
            Reset
            </button>

            </div>
        </div>



        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* SMS History and Accounts */}
            {[
                ["SMS History", Clock3],
                ["Accounts", Users],
            ].map(([label, Icon]) => {
                const ToolIcon = Icon as typeof Clock3;

                return (
                <button
                    key={label as string}
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[#403644] px-4 text-sm text-gray-500"
                >
                    <ToolIcon size={15} />
                    {label as string}
                </button>
                );
            })}

            {/* Send SMS */}
            <button
                type="button"
                onClick={() => setShowSMS(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
            >
                <Send size={15} />
                Send SMS
            </button>

        </div>
    </div>
</div>


{/* Main layout */}
<div className="mx-auto grid max-w-[1700px] grid-cols-1 gap-7 px-6 py-7 xl:grid-cols-[220px_minmax(0,1fr)] xl:px-10">
    {/* Folder Sidebar */}

{/* Folder Sidebar */}
<aside className="space-y-5">
{/* Main folders */}
<div className="space-y-1.5">
    <button
    type="button"
    onClick={() => setActiveFolder("All Applications")}
    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-all duration-200 ${
        activeFolder === "All Applications"
        ? "border-cyan-500/30 bg-cyan-500/[0.09] font-semibold text-cyan-300"
        : "border-transparent text-gray-400 hover:bg-[#1d2028] hover:text-white"
    }`}
    >
    <BriefcaseBusiness
        size={17}
        className={
        activeFolder === "All Applications"
            ? "text-cyan-400"
            : "text-gray-500"
        }
    />

    <span className="min-w-0 flex-1 truncate">
        All Applications
    </span>

    <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
        activeFolder === "All Applications"
            ? "bg-cyan-500/15 text-cyan-300"
            : "bg-[#22252e] text-gray-400"
        }`}
    >
        {applications.length}
    </span>
    </button>

    {currentUser?.role !== "BROKER" && (
    <button
        type="button"
        onClick={() => setActiveFolder("Unfiled")}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-all duration-200 ${
        activeFolder === "Unfiled"
            ? "border-cyan-500/30 bg-cyan-500/[0.09] font-semibold text-cyan-300"
            : "border-transparent text-gray-400 hover:bg-[#1d2028] hover:text-white"
        }`}
    >
        <Folder
        size={16}
        className={
            activeFolder === "Unfiled"
            ? "text-cyan-400"
            : "text-gray-500"
        }
        />

        <span className="min-w-0 flex-1 truncate">
        Unfiled
        </span>

        <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            activeFolder === "Unfiled"
            ? "bg-cyan-500/15 text-cyan-300"
            : "bg-[#22252e] text-gray-400"
        }`}
        >
        {applications.filter((app) => !app.assignedBrokerId).length}
        </span>
    </button>
    )}
</div>

{/* Shared folders */}
<div>
    <div className="mb-3 flex items-center justify-between px-3">
    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
        Shared Folders
    </span>

    <FolderOpen size={14} className="text-gray-600" />
    </div>

    <div className="space-y-1">
    {(currentUser?.role === "BROKER"
        ? [{ id: currentUser.id, name: currentUser.name }]
        : brokerOptions
    ).map((broker) => {
        const isActive = activeFolder === broker.id;

        const count = applications.filter(
        (app) => app.assignedBrokerId === broker.id
        ).length;

        return (
        <button
            key={broker.id}
            type="button"
            onClick={() => setActiveFolder(broker.id)}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
            isActive
                ? "border-cyan-500/30 bg-cyan-500/[0.09] font-semibold text-cyan-300"
                : "border-transparent text-gray-400 hover:bg-[#1d2028] hover:text-white"
            }`}
        >
            <Folder
            size={16}
            className={
                isActive ? "text-cyan-400" : "text-gray-500"
            }
            />

            <span className="min-w-0 flex-1 truncate">
            {broker.name}
            </span>

            <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                isActive
                ? "bg-cyan-500/15 text-cyan-300"
                : "bg-[#22252e] text-gray-400"
            }`}
            >
            {count}
            </span>
        </button>
        );
    })}
    </div>
</div>

{/* Personal folders */}
<div className="border-t border-[#292c35] pt-5">
    <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
    Personal Folders
    </div>

    <p className="px-3 text-xs italic text-gray-600">
    No personal folders
    </p>
</div>
</aside>


{/* Applications Content */}
<div className="min-w-0 space-y-6">
    {/* Staff application view switch */}
    {currentUser?.role === "STAFF" && (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#33333e] bg-[#15161c] p-3">
        <div className="px-2">
        <p className="text-sm font-semibold text-white">
            Application View
        </p>
        <p className="mt-1 text-xs text-gray-500">
            View your workload or follow up with other customers.
        </p>
        </div>

        <div className="flex items-center rounded-lg border border-[#393944] bg-[#101116] p-1">
        <button
            type="button"
            onClick={() => setStaffView("mine")}
            aria-pressed={staffView === "mine"}
            className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
            staffView === "mine"
                ? "bg-cyan-500/15 text-cyan-400"
                : "text-gray-400 hover:text-white"
            }`}
        >
            My Applications
        </button>

        <button
            type="button"
            onClick={() => setStaffView("all")}
            aria-pressed={staffView === "all"}
            className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
            staffView === "all"
                ? "bg-cyan-500/15 text-cyan-400"
                : "text-gray-400 hover:text-white"
            }`}
        >
            All Applications
        </button>
        </div>
    </div>
    )}
    {/* Analytics */}
    <section className="overflow-hidden rounded-xl border border-[#33333e] bg-[#15161c]">
        <button
        type="button"
        onClick={() => setShowAnalytics((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
        <span className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 size={17} className="text-cyan-400" />
            Application Overview
        </span>
        {showAnalytics ? (
            <ChevronDown size={17} className="text-gray-500" />
        ) : (
            <ChevronRight size={17} className="text-gray-500" />
        )}
        </button>


        <div
        className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-in-out motion-reduce:transition-none ${
            showAnalytics
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        inert={!showAnalytics}
        >
            <div className="min-h-0 overflow-hidden">
                <div className="border-t border-[#30303b] p-5">

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div
                key={stat.label}
                className="rounded-lg border border-[#373741] bg-[#202127] p-4"
                >
                <p className="text-[11px] font-semibold text-gray-500">
                    {stat.label}
                </p>
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                </p>
                </div>
            ))}
            </div>

                <div className="mt-5 rounded-lg border border-dashed border-[#3c3d46] p-4">
                    <p className="text-sm font-semibold text-gray-300">
                        Application Drop-off Analytics
                    </p>
                    <p className="mt-2 text-xs leading-6 text-gray-500">
                        Draft tracking, abandoned applications and weekly
                        drop-off charts will become available once we
                        implement automatic form progress saving.
                    </p>
                </div>
            </div>
        </div>
        </div>
    </section>
    
    {/* Customer Search */}
    <div className="relative">
        <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />

        <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, application ID or vehicle..."
            aria-label="Search finance applications"
            className="h-11 w-full rounded-lg border border-[#343640] bg-[#15161c] py-2 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-500 transition-colors hover:border-[#454954] focus:border-cyan-500"
        />
    </div>

    {/* Unassigned Applications */}
    {currentUser?.role !== "BROKER" && <section className="rounded-xl border border-[#33333e] bg-[#14151b] p-3 sm:p-4">
    <button
        type="button"
        onClick={() => setShowUnassigned((value) => !value)}
        aria-expanded={showUnassigned}
        className="mb-4 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#202127]"
        >
        <FolderOpen size={17} className="text-amber-400" />

        <h2 className="text-sm font-bold uppercase italic tracking-wide text-white">
            Unassigned Applications
        </h2>

        <span className="text-xs text-gray-500">
            {unassignedApplications.length}
        </span>

        <span className="ml-auto text-gray-500">
            {showUnassigned ? (
            <ChevronDown size={18} />
            ) : (
            <ChevronRight size={18} />
            )}
        </span>
    </button>


        <div
            className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-in-out motion-reduce:transition-none ${
                showUnassigned
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
            inert={!showUnassigned}
            >
            <div className="min-h-0 overflow-hidden">
                {loading ? (
                <p className="px-2 py-8 text-sm text-gray-500">
                    Loading applications...
                </p>
                ) : loadError ? (
                <p className="px-2 py-8 text-sm text-red-400">
                    {loadError}
                </p>
                ) : unassignedApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen size={35} className="text-gray-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-300">
                    No unassigned applications
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                    Applications waiting for broker assignment will appear here.
                    </p>
                </div>
                ) : (
                renderApplicationCards(unassignedApplications)
                )}
            </div>
        </div>
    </section>}

    {/* Applications List */}
    <section className="rounded-xl border border-[#33333e] bg-[#14151b] p-3 sm:p-4">
        <button
            type="button"
            onClick={() => setShowCurrent((value) => !value)}
            aria-expanded={showCurrent}
            className="mb-4 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#202127]"
            >
            <BriefcaseBusiness size={17} className="text-cyan-400" />

            <h2 className="text-sm font-bold uppercase italic tracking-wide text-white">
                {currentUser?.role === "STAFF"
                ? staffView === "all"
                    ? "Assigned Applications (All Staff)"
                    : "Current Applications (Assigned to Me)"
                : "Current Applications"}
            </h2>

            <span className="text-xs text-gray-500">
                {currentApplications.length}
            </span>

            <span className="ml-auto text-gray-500">
                <ChevronRight
                    size={18}
                    className={`transition-transform duration-[250ms] ease-in-out motion-reduce:transition-none ${
                        showCurrent ? "rotate-90" : "rotate-0"
                    }`}
                />
            </span>
        </button>


        <div
            className={`grid transition-[grid-template-rows,opacity] duration-[250ms] ease-in-out motion-reduce:transition-none ${
                showCurrent
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
            inert={!showCurrent}
            >
        <div className="min-h-0 overflow-hidden">

        {loading && (
            <div className="py-16 text-center text-sm text-gray-500">
                Loading applications...
            </div>
        )}

        {!loading && loadError && (
        <div className="rounded-lg border border-red-500/30 p-6 text-sm text-red-400">
            {loadError}
        </div>
        )}

        {!loading && !loadError && currentApplications.length === 0 && (
        <div className="py-20 text-center">
            <FolderOpen
            size={39}
            className="mx-auto text-gray-600"
            />
            <h3 className="mt-4 font-semibold text-gray-300">
            No applications found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
            Submitted finance applications will appear here.
            </p>
        </div>
        )}

        {renderApplicationCards(currentApplications)}
            <p className="px-2 pb-1 pt-5 text-xs text-gray-500">
                Showing {currentApplications.length} assigned application(s)
            </p>
        </div>
        </div>
    </section>
    </div>
</div>

{/* Send SMS modal — UI only */}
{showSMS && (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    onClick={() => setShowSMS(false)}
    >
    <div
        role="dialog"
        aria-modal="true"
        aria-label="Send finance application"
        className="w-full max-w-md rounded-2xl border border-[#393944] bg-[#1c1d24] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
    >
        <div className="mb-6 flex items-start justify-between gap-3">
        <div>
            <h2 className="text-xl font-bold">
            Send Finance Application
            </h2>
            <p className="mt-2 text-sm text-gray-400">
            Send the customer their application link.
            </p>
        </div>

        <button
            onClick={() => setShowSMS(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#30313a]"
            aria-label="Close"
        >
            <X size={20} />
        </button>
        </div>

        <div className="space-y-5">
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-gray-300">
            <UserRound size={16} />
            Customer Name
            </span>
            <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
            className={inputStyle}
            />
        </label>

        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-gray-300">
            <Phone size={16} />
            Phone Number
            </span>
            <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+61412345678"
            className={inputStyle}
            />
        </label>

        <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4">
            <p className="text-xs font-semibold text-cyan-400">
            SMS PREVIEW
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-300">
            Hi {customerName || "[Customer Name]"}, please
            complete your Carmart Perth finance application
            using the secure link provided.
            </p>
        </div>

        <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#343541] px-5 py-3 text-sm font-semibold text-gray-400"
        >
            <Send size={16} />
            Send SMS — Coming Soon
        </button>

        <p className="text-center text-xs text-gray-500">
            We'll connect your existing Twilio integration next.
        </p>
        </div>
    </div>
    </div>
)}

{/* Application details modal */}
{selected && (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    onClick={() => setSelected(null)}
    >
    <div
        role="dialog"
        aria-modal="true"
        aria-label="Application details"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#393944] bg-[#1c1d24] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
    >
        <div className="flex items-start justify-between">
        <div>
            <p className="break-all font-mono text-xs text-cyan-400">
            {selected.id}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
            {selected.name}
            </h2>
        </div>

        <button
            onClick={() => setSelected(null)}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#30313a]"
            aria-label="Close"
        >
            <X size={20} />
        </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
            ["Phone", selected.phone],
            ["Vehicle", selected.vehicle],
            ["Loan Amount", money(selected.amount)],
            ["Status", selected.status],
            ["Submitted", formatDate(selected.submitted)],
        ].map(([label, value]) => (
            <div
            key={label}
            className="rounded-xl border border-[#383943] bg-[#25262e] p-4"
            >
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-2 break-words text-sm font-semibold text-white">
                {value}
            </p>
            </div>
        ))}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-[#3e3f49] p-6 text-center">
        <FileText
            size={28}
            className="mx-auto text-cyan-400"
        />
        <h3 className="mt-3 font-semibold">
            Full Application Details
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-400">
            We'll connect the seven application sections,
            supporting documents and broker status history
            in the next stage.
        </p>
        </div>
    </div>
    </div>
)}
    {currentUser && (
    <AssignmentModal
        open={assignmentModal !== null}
        applicationId={assignmentModal?.applicationId ?? ""}
        applicantName={assignmentModal?.applicantName ?? ""}
        assignedStaffName={
            assignmentModal?.assignedStaffName ?? null
        }
        assignedBrokerName={
            assignmentModal?.assignedBrokerName ?? null
        }
        type={assignmentModal?.type ?? "staff"}
        options={
        assignmentModal?.type === "broker"
            ? brokerOptions
            : staffOptions
        }
        actorRole={currentUser.role}
        actorName={currentUser.name}
        onClose={() => setAssignmentModal(null)}
        onAssigned={() => window.location.reload()}
    />
    )}
</main>
);
}
