import { NextResponse } from "next/server";
import { getPlayerSummary } from "@/lib/fpl/client";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return NextResponse.json(await getPlayerSummary(Number(id)));
}
