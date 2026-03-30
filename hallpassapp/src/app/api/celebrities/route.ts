import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { STATIC_CELEBRITY_ENTRIES } from "@/data/static-celebrities";
import { slugifyCelebrityName } from "@/lib/celebrity-slug";
import { verifyCelebrityPublicFigure } from "@/lib/celebrity-verify";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const fb = getFirebaseAdminDb();

  if (fb) {
    const snap = await fb.collection("celebrities").orderBy("name").limit(120).get();
    let rows = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        name: typeof x.name === "string" ? x.name : "",
        slug: typeof x.slug === "string" ? x.slug : "",
      };
    });
    if (q) {
      const qn = q.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(qn));
    }
    return NextResponse.json({ celebrities: rows.slice(0, 40) });
  }

  const admin = getSupabaseAdmin();

  if (admin) {
    let query = admin
      .from("celebrities")
      .select("id,name,slug")
      .order("name")
      .limit(40);
    if (q) {
      query = query.ilike("name", `%${q}%`);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ celebrities: data ?? [] });
  }

  const qn = q.toLowerCase();
  const list = qn
    ? STATIC_CELEBRITY_ENTRIES.filter((c) =>
        c.name.toLowerCase().includes(qn)
      )
    : STATIC_CELEBRITY_ENTRIES;
  const celebrities = list.slice(0, 40).map((c) => ({
    id: c.id,
    name: c.name,
    slug: slugifyCelebrityName(c.name),
  }));
  return NextResponse.json({ celebrities });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name =
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name
      : "";

  const verified = await verifyCelebrityPublicFigure(name);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  const trimmed = name.trim();
  const slugBase = slugifyCelebrityName(trimmed);
  let slug = slugBase;
  const fbDb = getFirebaseAdminDb();

  if (fbDb) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const dup = await fbDb
        .collection("celebrities")
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (dup.empty) break;
      slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;
    }
    const ref = await fbDb.collection("celebrities").add({
      name: trimmed,
      slug,
      is_verified_public_figure: Boolean(process.env.OPENAI_API_KEY),
      is_sponsored: false,
      is_active_campaign: false,
      created_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({
      celebrity: { id: ref.id, name: trimmed, slug },
    });
  }

  const admin = getSupabaseAdmin();

  if (admin) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: row } = await admin
        .from("celebrities")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!row) break;
      slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const { data, error } = await admin
      .from("celebrities")
      .insert({
        name: trimmed,
        slug,
        is_verified_public_figure: Boolean(process.env.OPENAI_API_KEY),
      })
      .select("id,name,slug")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ celebrity: data });
  }

  const id = `local-${crypto.randomUUID()}`;
  return NextResponse.json({
    celebrity: {
      id,
      name: trimmed,
      slug,
      source: "local_preview" as const,
    },
  });
}
