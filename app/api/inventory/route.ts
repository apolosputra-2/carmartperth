import { NextResponse } from "next/server";

const INVENTORY_URL =
  "https://onsellr.com/widget/v1/orgs/88/inventory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get("page") ?? "1");

  if (!Number.isSafeInteger(page) || page < 1 || page > 100) {
    return NextResponse.json(
      { error: "Invalid page number" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(INVENTORY_URL);

    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "60");

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Inventory feed returned ${response.status}`
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !("listings" in data) ||
      !Array.isArray(data.listings)
    ) {
      throw new Error("Unexpected inventory response");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Inventory fetch failed:", error);

    return NextResponse.json(
      { error: "Unable to load inventory" },
      { status: 502 }
    );
  }
}
