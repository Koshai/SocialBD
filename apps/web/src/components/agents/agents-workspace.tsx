"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { getPlatformLabel } from "@/lib/platform-labels";

type AgentTemplate = {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  category: string;
  systemPromptEn: string;
  systemPromptBn: string;
};

type Channel = {
  id: string;
  platform: string;
  displayName: string;
  username: string | null;
  providerAccountId: string;
  pictureUrl: string | null;
};

type Agent = {
  id: string;
  connectedAccountId: string;
  name: string;
  templateId: string | null;
  systemPrompt: string;
  language: string;
  tone: string;
  replyMessenger: boolean;
  replyComments: boolean;
  requireMention: boolean;
  enabled: boolean;
  channelName: string;
  platform: string;
};

type InboxEvent = {
  id: string;
  eventType: string;
  platform: string;
  status: string;
  incomingText: string | null;
  replyText: string | null;
  error: string | null;
  createdAt: string;
};

type AgentsPayload = {
  agents: Agent[];
  events: InboxEvent[];
  channels: Channel[];
  templates: AgentTemplate[];
};

const TONES = ["friendly", "professional", "concise"] as const;

export function AgentsWorkspace() {
  const { t, locale } = usePreferences();
  const [data, setData] = useState<AgentsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [connectedAccountId, setConnectedAccountId] = useState("");
  const [templateId, setTemplateId] = useState("customer-support");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [replyMessenger, setReplyMessenger] = useState(true);
  const [replyComments, setReplyComments] = useState(true);
  const [requireMention, setRequireMention] = useState(true);
  const [enabled, setEnabled] = useState(false);

  async function load() {
    setError(null);
    const response = await fetch("/api/agents");
    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? t("agents.loadError"));
      return;
    }
    const json = (await response.json()) as AgentsPayload;
    setData(json);
    if (!connectedAccountId && json.channels[0]) {
      setConnectedAccountId(json.channels[0].id);
    }
    if (!systemPrompt && json.templates[0]) {
      const tpl = json.templates.find((item) => item.id === templateId) ?? json.templates[0];
      setSystemPrompt(language === "bn" ? tpl.systemPromptBn : tpl.systemPromptEn);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const selectedTemplate = useMemo(
    () => data?.templates.find((item) => item.id === templateId) ?? null,
    [data, templateId],
  );

  function applyTemplate(nextTemplateId: string, nextLanguage: "en" | "bn" = language) {
    setTemplateId(nextTemplateId);
    const tpl = data?.templates.find((item) => item.id === nextTemplateId);
    if (!tpl) return;
    setSystemPrompt(nextLanguage === "bn" ? tpl.systemPromptBn : tpl.systemPromptEn);
    if (!name.trim()) {
      setName(nextLanguage === "bn" ? tpl.nameBn : tpl.name);
    }
  }

  function editAgent(agent: Agent) {
    setConnectedAccountId(agent.connectedAccountId);
    setTemplateId(agent.templateId ?? "customer-support");
    setName(agent.name);
    setLanguage(agent.language === "bn" ? "bn" : "en");
    setTone((TONES.includes(agent.tone as (typeof TONES)[number])
      ? agent.tone
      : "friendly") as (typeof TONES)[number]);
    setSystemPrompt(agent.systemPrompt);
    setReplyMessenger(agent.replyMessenger);
    setReplyComments(agent.replyComments);
    setRequireMention(agent.requireMention);
    setEnabled(agent.enabled);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedAccountId,
          name: name.trim() || undefined,
          templateId,
          systemPrompt,
          language,
          tone,
          replyMessenger,
          replyComments,
          requireMention,
          enabled,
        }),
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(json?.error ?? t("agents.saveError"));
        return;
      }
      setMessage(enabled ? t("agents.savedEnabled") : t("agents.savedDraft"));
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <Card>
        <CardTitle>{t("agents.title")}</CardTitle>
        <CardDescription>{error}</CardDescription>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardTitle>{t("agents.title")}</CardTitle>
        <CardDescription>{t("auth.loading")}</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>{t("agents.title")}</CardTitle>
        <CardDescription>{t("agents.subtitle")}</CardDescription>
        <p className="mt-3 text-sm text-muted">{t("agents.setupHint")}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle>{t("agents.deployTitle")}</CardTitle>
          <CardDescription>{t("agents.deployDesc")}</CardDescription>

          <div className="mt-4 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("agents.channel")}</span>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={connectedAccountId}
                onChange={(event) => setConnectedAccountId(event.target.value)}
              >
                {data.channels.length === 0 ? (
                  <option value="">{t("agents.noChannels")}</option>
                ) : (
                  data.channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {getPlatformLabel(channel.platform, t)} — {channel.displayName}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div>
              <p className="mb-2 text-sm font-medium">{t("agents.templates")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.templates.map((template) => {
                  const active = template.id === templateId;
                  const label = locale === "bn" ? template.nameBn : template.name;
                  const desc = locale === "bn" ? template.descriptionBn : template.description;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={[
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-background",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-1 block text-xs text-muted">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("agents.name")}</span>
              <input
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={selectedTemplate ? (locale === "bn" ? selectedTemplate.nameBn : selectedTemplate.name) : ""}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("agents.language")}</span>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={language}
                  onChange={(event) => {
                    const next = event.target.value === "bn" ? "bn" : "en";
                    setLanguage(next);
                    applyTemplate(templateId, next);
                  }}
                >
                  <option value="en">{t("appearance.english")}</option>
                  <option value="bn">{t("appearance.bangla")}</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("agents.toneLabel")}</span>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={tone}
                  onChange={(event) => setTone(event.target.value as (typeof TONES)[number])}
                >
                  {TONES.map((item) => (
                    <option key={item} value={item}>
                      {t(`agents.tones.${item}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("agents.prompt")}</span>
              <textarea
                className="min-h-40 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
              />
            </label>

            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={replyMessenger}
                  onChange={(event) => setReplyMessenger(event.target.checked)}
                />
                {t("agents.replyMessenger")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={replyComments}
                  onChange={(event) => setReplyComments(event.target.checked)}
                />
                {t("agents.replyComments")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requireMention}
                  onChange={(event) => setRequireMention(event.target.checked)}
                />
                {t("agents.requireMention")}
              </label>
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                {t("agents.enabled")}
              </label>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

            <Button
              type="button"
              disabled={saving || !connectedAccountId || !systemPrompt.trim()}
              onClick={() => void save()}
            >
              {saving ? t("common.working") : t("agents.save")}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>{t("agents.deployedTitle")}</CardTitle>
            <CardDescription>{t("agents.deployedDesc")}</CardDescription>
            <ul className="mt-4 space-y-3">
              {data.agents.length === 0 ? (
                <li className="text-sm text-muted">{t("agents.noneDeployed")}</li>
              ) : (
                data.agents.map((agent) => (
                  <li key={agent.id} className="rounded-xl border border-border px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted">
                          {getPlatformLabel(agent.platform, t)} · {agent.channelName}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {agent.enabled ? t("agents.statusOn") : t("agents.statusOff")}
                        </p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => editAgent(agent)}>
                        {t("agents.edit")}
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card>
            <CardTitle>{t("agents.activityTitle")}</CardTitle>
            <CardDescription>{t("agents.activityDesc")}</CardDescription>
            <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {data.events.length === 0 ? (
                <li className="text-sm text-muted">{t("agents.noActivity")}</li>
              ) : (
                data.events.map((event) => (
                  <li key={event.id} className="rounded-xl border border-border px-3 py-3 text-sm">
                    <p className="font-medium">
                      {event.eventType} · {event.status}
                    </p>
                    {event.incomingText ? (
                      <p className="mt-1 text-muted line-clamp-2">{event.incomingText}</p>
                    ) : null}
                    {event.replyText ? (
                      <p className="mt-1 text-foreground line-clamp-2">{event.replyText}</p>
                    ) : null}
                    {event.error ? <p className="mt-1 text-xs text-red-700">{event.error}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
