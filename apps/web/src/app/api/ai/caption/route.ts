import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { generatePostCaption, type CaptionTone } from "@/lib/openai-caption";

const TONES = new Set<CaptionTone>(["casual", "professional", "promotional"]);

export async function POST(request: Request) {
  await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const brief =
    typeof json === "object" && json !== null && "brief" in json
      ? String((json as { brief: unknown }).brief)
      : "";
  const toneRaw =
    typeof json === "object" && json !== null && "tone" in json
      ? String((json as { tone: unknown }).tone)
      : "casual";
  const tone = TONES.has(toneRaw as CaptionTone) ? (toneRaw as CaptionTone) : "casual";

  try {
    const caption = await generatePostCaption({ brief, tone });
    return NextResponse.json({ caption });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate caption.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
