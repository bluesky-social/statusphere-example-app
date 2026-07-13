import { NextRequest, NextResponse } from "next/server";
import { Client, l } from "@atproto/lex";
import { getSession } from "@/lib/auth/session";
import { insertStatus } from "@/lib/db/queries";
import * as xyz from "@/lib/lexicons/xyz";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await request.json();
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const lexClient = new Client(session);

  const createdAt = l.currentDatetimeString();
  const res = await lexClient.create(xyz.statusphere.status, {
    status,
    createdAt,
  });

  // Optimistic write: save locally for immediate display
  await insertStatus({
    uri: res.uri,
    authorDid: session.did,
    status,
    createdAt,
    indexedAt: createdAt,
    current: 1,
  });

  return NextResponse.json({
    success: true,
    uri: res.uri,
  });
}
