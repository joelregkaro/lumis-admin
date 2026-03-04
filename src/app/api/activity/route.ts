import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/queries";

export async function GET() {
  const activity = await getRecentActivity(50);
  return NextResponse.json(activity);
}
