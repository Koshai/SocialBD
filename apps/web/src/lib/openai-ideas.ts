import { chatCompletion, type CaptionTone } from "./openai-client";

const TONE_HINTS: Record<CaptionTone, string> = {
  casual: "Friendly and conversational for Bangladeshi social audiences.",
  professional: "Clear, professional, and trustworthy.",
  promotional: "Engaging promotional tone with a soft call to action.",
};

const IDEA_SYSTEM =
  "You help Bangladeshi businesses brainstorm social media content ideas before publishing. " +
  "Use plain English unless the brief asks for Bangla (বাংলা). No hashtags unless asked. " +
  "Keep captions concise and ready to edit.";

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(String).map((t) => t.trim()).filter(Boolean))].slice(0, 8);
}

export type GeneratedIdea = {
  title: string;
  body: string;
  tagNames: string[];
};

function normalizeIdea(raw: { title?: string; body?: string; tags?: unknown }): GeneratedIdea {
  const body = String(raw.body ?? "").trim();
  const title = String(raw.title ?? "").trim() || body.slice(0, 60) || "Untitled idea";
  return { title, body, tagNames: normalizeTags(raw.tags) };
}

function contextLine(input: {
  brief: string;
  tone: CaptionTone;
  campaignName?: string | null;
}) {
  const parts = [`Tone: ${TONE_HINTS[input.tone]}`, `Brief: ${input.brief.trim()}`];
  if (input.campaignName?.trim()) {
    parts.push(`Campaign: ${input.campaignName.trim()}`);
  }
  return parts.join("\n");
}

export async function generateContentIdea(input: {
  brief: string;
  tone: CaptionTone;
  campaignName?: string | null;
}) {
  if (!input.brief.trim()) {
    throw new Error("Describe your idea or topic first.");
  }

  const raw = await chatCompletion({
    jsonMode: true,
    maxTokens: 500,
    messages: [
      { role: "system", content: IDEA_SYSTEM },
      {
        role: "user",
        content:
          `${contextLine(input)}\n\n` +
          "Return JSON only: {\"title\":\"short title\",\"body\":\"caption draft\",\"tags\":[\"tag1\",\"tag2\"]}.",
      },
    ],
  });

  return normalizeIdea(parseJson(raw));
}

export async function expandContentIdea(input: {
  brief: string;
  tone: CaptionTone;
  title?: string;
  body?: string;
  campaignName?: string | null;
}) {
  const seed = [input.body?.trim(), input.brief.trim(), input.title?.trim()].find(Boolean);
  if (!seed) {
    throw new Error("Add a brief or caption to expand.");
  }

  const raw = await chatCompletion({
    jsonMode: true,
    maxTokens: 550,
    messages: [
      { role: "system", content: IDEA_SYSTEM },
      {
        role: "user",
        content:
          `${contextLine({ brief: input.brief || seed, tone: input.tone, campaignName: input.campaignName })}\n` +
          (input.title ? `Current title: ${input.title}\n` : "") +
          `Current caption:\n${input.body || seed}\n\n` +
          "Polish and expand into a stronger draft. Return JSON only: " +
          '{"title":"...","body":"...","tags":["..."]}.',
      },
    ],
  });

  return normalizeIdea(parseJson(raw));
}

export async function brainstormContentIdeas(input: {
  brief: string;
  tone: CaptionTone;
  campaignName?: string | null;
  count?: number;
}) {
  if (!input.brief.trim()) {
    throw new Error("Describe a theme or campaign topic first.");
  }

  const count = Math.min(Math.max(input.count ?? 3, 2), 5);

  const raw = await chatCompletion({
    jsonMode: true,
    maxTokens: 900,
    temperature: 0.8,
    messages: [
      { role: "system", content: IDEA_SYSTEM },
      {
        role: "user",
        content:
          `${contextLine(input)}\n\n` +
          `Generate exactly ${count} distinct content ideas. ` +
          'Return JSON only: {"ideas":[{"title":"...","body":"...","tags":["..."]}, ...]}.',
      },
    ],
  });

  const parsed = parseJson<{ ideas?: Array<{ title?: string; body?: string; tags?: unknown }> }>(
    raw,
  );
  const ideas = (parsed.ideas ?? []).map(normalizeIdea).filter((idea) => idea.body.length > 0);
  if (ideas.length === 0) {
    throw new Error("OpenAI returned no ideas.");
  }
  return ideas;
}
