import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "true";
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const sb = getSupabase();

  let query = sb
    .from("prompt_versions")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("prompt_type", type);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { prompt_type, version, content, change_summary, parent_version, model, status } = body;

  if (!prompt_type || !version || !content) {
    return NextResponse.json(
      { error: "prompt_type, version, and content are required" },
      { status: 400 },
    );
  }

  const sb = getSupabase();

  const { data, error } = await sb
    .from("prompt_versions")
    .insert({
      prompt_type,
      version,
      content,
      change_summary: change_summary || null,
      parent_version: parent_version || null,
      model: model || null,
      status: status || "draft",
      author: "admin",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `Version ${version} already exists for ${prompt_type}` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, content, change_summary } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const sb = getSupabase();

  // When promoting to production, demote the current production version first
  if (status === "production") {
    const { data: current } = await sb
      .from("prompt_versions")
      .select("id, prompt_type")
      .eq("id", id)
      .single();

    if (current) {
      await sb
        .from("prompt_versions")
        .update({ status: "deprecated", updated_at: new Date().toISOString() })
        .eq("prompt_type", current.prompt_type)
        .eq("status", "production");
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (content !== undefined) updates.content = content;
  if (change_summary !== undefined) updates.change_summary = change_summary;

  const { data, error } = await sb
    .from("prompt_versions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
