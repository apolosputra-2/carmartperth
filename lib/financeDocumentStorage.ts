
import "server-only";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storageDirectory = path.join(
  process.cwd(),
  "private-uploads"
);

export async function saveFinanceDocument(file: File) {
  if (
    !allowedMimeTypes.has(file.type) ||
    file.size === 0 ||
    file.size > MAX_DOCUMENT_SIZE
  ) {
    throw new Error("Invalid document type or size.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Basic file signature validation.
  const validSignature =
    (file.type === "application/pdf" &&
      buffer.subarray(0, 5).toString() === "%PDF-") ||
    (file.type === "image/png" &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      )) ||
    (file.type === "image/jpeg" &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff) ||
    (file.type === "image/webp" &&
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP");

  if (!validSignature) {
    throw new Error("Document content does not match its file type.");
  }

  await mkdir(storageDirectory, { recursive: true });

  const storageKey = randomUUID();

  await writeFile(
    path.join(storageDirectory, storageKey),
    buffer,
    { flag: "wx" }
  );

  return {
    storageKey,
    originalName: file.name.slice(0, 255),
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
