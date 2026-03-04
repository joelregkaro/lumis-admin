import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json([], { status: 400 });
  const messages = await getSessionMessages(sessionId);
  return NextResponse.json(messages);
}
