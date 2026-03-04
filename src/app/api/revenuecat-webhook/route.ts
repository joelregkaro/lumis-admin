import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.REVENUECAT_WEBHOOK_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body?.event;
  if (!event) {
    return NextResponse.json({ error: "Missing event payload" }, { status: 400 });
  }

  const eventType = event.type as string;
  const appUserId = event.app_user_id as string;
  const productId = event.product_id as string | null;
  const priceCents = event.price_in_purchased_currency != null
    ? Math.round(event.price_in_purchased_currency * 100)
    : 0;
  const currency = (event.currency as string) || "USD";
  const purchasedAt = event.purchased_at_ms
    ? new Date(event.purchased_at_ms).toISOString()
    : null;
  const expirationDate = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;
  const environment = (event.environment as string) || "PRODUCTION";
  const store = (event.store as string) || null;

  const sb = getSupabase();

  const { error } = await sb.from("subscription_events").insert({
    user_id: appUserId,
    event_type: eventType,
    product_id: productId,
    revenue_cents: priceCents,
    currency,
    platform: store,
    details: {
      purchased_at: purchasedAt,
      expiration_date: expirationDate,
      environment,
      store,
      original_event_type: eventType,
      raw_event_id: event.id,
      period_type: event.period_type,
      presented_offering_id: event.presented_offering_context?.offering_id,
    },
  });

  if (error) {
    console.error("Failed to insert subscription event:", error);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  // Update user subscription state for key events
  const upgradeEvents = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
  ];
  const downgradeEvents = [
    "CANCELLATION",
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  if (upgradeEvents.includes(eventType) && appUserId) {
    await sb
      .from("users")
      .update({
        subscription_tier: "pro",
        subscription_started_at: purchasedAt || new Date().toISOString(),
        subscription_expires_at: expirationDate,
      })
      .eq("id", appUserId);

    if (priceCents > 0) {
      const { data: currentUser } = await sb
        .from("users")
        .select("lifetime_revenue_cents")
        .eq("id", appUserId)
        .single();

      if (currentUser) {
        await sb
          .from("users")
          .update({
            lifetime_revenue_cents: (currentUser.lifetime_revenue_cents || 0) + priceCents,
          })
          .eq("id", appUserId);
      }
    }
  }

  if (downgradeEvents.includes(eventType) && appUserId) {
    await sb
      .from("users")
      .update({ subscription_tier: "free" })
      .eq("id", appUserId);
  }

  return NextResponse.json({ ok: true });
}
