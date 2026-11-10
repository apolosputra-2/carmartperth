
import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
      documentId: string;
    }>;
  }
) {
  const user = await getPortalUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  if (user.role !== "STAFF" && user.role !== "BOSS") {
    return NextResponse.json(
      { error: "Only staff and bosses can delete invoices." },
      { status: 403 }
    );
  }

  const { id, documentId } = await context.params;

  try {
    const document = await prisma.financeDocument.findFirst({
      where: {
        id: documentId,
        applicationId: id,
        category: "settlementInvoice",
        application: {
          submittedAt: { not: null },
        },
      },
      select: {
        id: true,
        storageKey: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Settlement invoice not found." },
        { status: 404 }
      );
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(document.storageKey)) {
      return NextResponse.json(
        { error: "Invalid file reference." },
        { status: 500 }
      );
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.financeDocument.deleteMany({
        where: {
          id: documentId,
          applicationId: id,
          category: "settlementInvoice",
        },
      });

      if (result.count === 1) {
        await tx.documentAccessLog.create({
          data: {
            applicationId: id,
            documentId,
            accessedById: user.id,
            action: "SETTLEMENT_INVOICE_DELETE",
          },
        });
      }

      return result.count === 1;
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Invoice was already removed." },
        { status: 409 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "private-uploads",
      document.storageKey
    );

    try {
      await unlink(filePath);
    } catch (error) {
      logServerError({
        operation: "settlement-invoice-file-cleanup",
        error,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError({
      operation: "settlement-invoice-delete",
      error,
    });

    return NextResponse.json(
      { error: "Unable to delete settlement invoice." },
      { status: 500 }
    );
  }
}
