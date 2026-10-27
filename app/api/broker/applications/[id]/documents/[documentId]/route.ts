
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      documentId: string;
    }>;
  }
) {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    if (
      user.role !== "STAFF" &&
      user.role !== "BOSS" &&
      user.role !== "BROKER"
    ) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const { id, documentId } = await context.params;

    const document = await prisma.financeDocument.findFirst({
      where: {
        id: documentId,
        applicationId: id,
        application: {
          submittedAt: { not: null },
          ...(user.role === "BROKER"
            ? { assignedBrokerId: user.id }
            : {}),
        },
      },
      select: {
        storageKey: true,
        originalName: true,
        mimeType: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    // Storage keys must be generated UUIDs, never file paths.
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(document.storageKey)) {
      return NextResponse.json(
        { error: "Invalid document storage reference." },
        { status: 500 }
      );
    }

    const allowedMimeTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedMimeTypes.has(document.mimeType)) {
      return NextResponse.json(
        { error: "Unsupported document type." },
        { status: 415 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "private-uploads",
      document.storageKey
    );

    let buffer: Buffer;

    try {
      buffer = await readFile(filePath);
    } catch {
      return NextResponse.json(
        { error: "Stored document unavailable." },
        { status: 404 }
      );
    }

    const safeFilename = document.originalName
      .replace(/[\r\n"\\]/g, "_")
      .replace(/[^\x20-\x7E]/g, "_")
      .slice(0, 180);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition":
          `attachment; filename="${safeFilename || "document"}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Document download error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve document." },
      { status: 500 }
    );
  }
}
