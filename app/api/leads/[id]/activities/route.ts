
import { NextResponse } from "next/server";
import { ActivityType } from "@prisma/client";
import {prisma} from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET — Retrieve activity history
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params;
  const leadId = Number(id);

  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    return NextResponse.json(
      { error: "Invalid lead ID" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 }
    );
  }

  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(activities);
}

// POST — Create a new activity
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params;
  const leadId = Number(id);

  if (!Number.isSafeInteger(leadId) || leadId <= 0) {
    return NextResponse.json(
      { error: "Invalid lead ID" },
      { status: 400 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;
  const { type, content } = data;

  if (
    typeof type !== "string" ||
    !Object.values(ActivityType).includes(type as ActivityType) ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return NextResponse.json(
      { error: "Valid activity type and content are required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 }
    );
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId,
      type: type as ActivityType,
      content: content.trim(),
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
