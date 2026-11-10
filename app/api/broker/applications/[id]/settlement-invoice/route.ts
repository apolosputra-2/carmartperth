
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CATEGORY = "settlementInvoice";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  const user = await getPortalUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in." },
      { status: 401 }
    );
  }

  if (!["STAFF", "BOSS", "BROKER"].includes(user.role)) {
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  try {
    const application = await prisma.financeApplication.findFirst({
      where: {
        id,
        submittedAt: { not: null },
        ...(user.role === "BROKER"
          ? { assignedBrokerId: user.id }
          : {}),
      },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    const invoices = await prisma.financeDocument.findMany({
      where: {
        applicationId: id,
        category: CATEGORY,
      },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        originalName: true,
        sizeBytes: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(
      { invoices },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    logServerError({
      operation: "settlement-invoice-list",
      error,
    });

    return NextResponse.json(
      { error: "Unable to load settlement invoices." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const user = await getPortalUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in." },
      { status: 401 }
    );
  }

  if (!["STAFF", "BOSS", "BROKER"].includes(user.role)) {
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  // Reject oversized requests before parsing multipart data.
  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    Number(contentLength) > MAX_FILE_SIZE + 100_000
  ) {
    return NextResponse.json(
      { error: "Maximum file size is 10 MB." },
      { status: 413 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid upload request." },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please select a file." },
      { status: 400 }
    );
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be between 1 byte and 10 MB." },
      { status: 413 }
    );
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, JPG, and PNG files are allowed." },
      { status: 415 }
    );
  }

  const originalName = file.name
    .replace(/[\r\n"\\]/g, "_")
    .replace(/[^\x20-\x7E]/g, "_")
    .slice(0, 180);

  if (!originalName.trim()) {
    return NextResponse.json(
      { error: "Invalid filename." },
      { status: 400 }
    );
  }

  try {
    const application = await prisma.financeApplication.findFirst({
      where: {
        id,
        submittedAt: { not: null },
        ...(user.role === "BROKER"
          ? { assignedBrokerId: user.id }
          : {}),
      },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found or access denied." },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Check the actual file signature, not just MIME type.
    const validPdf =
      file.type === "application/pdf" &&
      buffer.subarray(0, 5).toString("ascii") === "%PDF-";

    const validJpeg =
      file.type === "image/jpeg" &&
      buffer.length >= 4 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    const validPng =
      file.type === "image/png" &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );

    if (!validPdf && !validJpeg && !validPng) {
      return NextResponse.json(
        { error: "File content does not match its type." },
        { status: 415 }
      );
    }

    const storageKey = randomUUID();
    const storageDirectory = path.join(
      process.cwd(),
      "private-uploads"
    );

    const filePath = path.join(storageDirectory, storageKey);

    await mkdir(storageDirectory, {
      recursive: true,
      mode: 0o700,
    });

    await writeFile(filePath, buffer, {
      flag: "wx",
      mode: 0o600,
    });

    try {
      // Recheck access before saving the database record.
      const stillAllowed = await prisma.financeApplication.findFirst({
        where: {
          id,
          submittedAt: { not: null },
          ...(user.role === "BROKER"
            ? { assignedBrokerId: user.id }
            : {}),
        },
        select: { id: true },
      });

      if (!stillAllowed) {
        await unlink(filePath);
        return NextResponse.json(
          { error: "Application access has changed." },
          { status: 409 }
        );
      }

      const invoice = await prisma.financeDocument.create({
        data: {
          applicationId: id,
          category: CATEGORY,
          originalName,
          storageKey,
          mimeType: file.type,
          sizeBytes: buffer.length,
        },
        select: {
          id: true,
          originalName: true,
          sizeBytes: true,
          uploadedAt: true,
        },
      });

      return NextResponse.json(
        { success: true, invoice },
        { status: 201 }
      );
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    logServerError({
      operation: "settlement-invoice-upload",
      error,
    });

    return NextResponse.json(
      { error: "Unable to upload settlement invoice." },
      { status: 500 }
    );
  }
}
