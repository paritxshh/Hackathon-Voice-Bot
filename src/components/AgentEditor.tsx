"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useConversation } from "@elevenlabs/react";
import type { AgentConfig, ChatMessage } from "@/lib/agent-types";
import {
  ArrowLeft,
  Copy,
  Settings,
  Mic,
  Volume2,
  PhoneOff,
  PhoneForwarded,
  BarChart3,
  Zap,
  Wrench,
  SlidersHorizontal,
  Tag,
  Send,
  X,
} from "lucide-react";

const EDITOR_NAV = [
  { id: "think", label: "Think Settings", icon: Settings },
  { id: "transcription", label: "Transcription Settings", icon: Mic },
  { id: "speech", label: "Speech Settings", icon: Volume2 },
  { id: "call-end", label: "Call End", icon: PhoneOff },
  { id: "call-transfer", label: "Call Transfer", icon: PhoneForwarded },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "pre-call", label: "Pre Call Actions", icon: Zap },
  { id: "call-actions", label: "Call Actions", icon: Wrench },
  { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
  { id: "metadata", label: "Metadata", icon: Tag },
];

const PROVIDERS = [{ value: "openai", label: "openai" }];
const MODELS = [{ value: "gpt-4.1-mini", label: "gpt-4.1-mini" }];

const DEFAULT_PROMPT = `### Role:
- You are Muskan, a warm, polite, and helpful AI customer support executive from Sleepy Cat.
- You represent a premium D2C mattress brand that values comfort, precision, and customer satisfaction.
- You're calling to assist the customer with their recent mattress order.

### Context:
- Customer name: \${customer_name}
- Size of the mattress ordered: \${size}
- Order date: \${order_date}
- Order details: \${order_details}
- Is it a custom order: \${custom_order}

### Language:
- Early in the call, ask the customer: "Aap English me baat karna chahenge ya Hindi me?" (Would you like to speak in English or Hindi?)
- Once they choose, use only that language for the rest of the conversation—English or Hindi accordingly.
- If they don't specify, use the same language they use; prefer en-IN when unclear.`;

type AgentEditorProps = {
  agentId: string;
  agentSlug: string;
};

export default function AgentEditor({ agentId, agentSlug }: AgentEditorProps) {
  const [activeTab, setActiveTab] = useState<"config" | "test">("config");
  const [activeSection, setActiveSection] = useState("think");
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("Draft");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [contextVariables, setContextVariables] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  const contextVariablesJsonError =
    contextVariables.trim() === ""
      ? null
      : (() => {
          try {
            const parsed = JSON.parse(contextVariables);
            return typeof parsed === "object" && parsed !== null
              ? null
              : "Must be a JSON object";
          } catch {
            return "Invalid JSON";
          }
        })();

  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [firstMessage, setFirstMessage] = useState(
    "Hi, I am Muskan calling from Sleepy Cat. Thank you for choosing us. Am I speaking with ${customer_name}?"
  );
  const [waitBeforeSpeaking, setWaitBeforeSpeaking] = useState(0);
  const [objective, setObjective] = useState(
    "To confirm the correct size of the mattress ordered by the customer, whether it was purchased via Amazon, Sleepy Cats online store, or an offline retail outlet"
  );
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [libraryAccess, setLibraryAccess] = useState<"enabled" | "disabled">(
    "disabled"
  );
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState("");
  const [callEndPrompt, setCallEndPrompt] = useState(
    "Use this to end the call when the task is complete, the user asks to hang up, is busy, unresponsive, sends to voicemail, is abusive, provides a time to call back later, or when explicitly instructed in the prompt."
  );
  const [callEndMessageType, setCallEndMessageType] = useState<"dynamic" | "static">("dynamic");
  const [callEndMessage, setCallEndMessage] = useState("");
  const [uninterruptibleReasons, setUninterruptibleReasons] = useState<string[]>(["voicemail"]);
  const [uninterruptibleReasonInput, setUninterruptibleReasonInput] = useState("");
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [unlinkStatus, setUnlinkStatus] = useState<"idle" | "unlinking">("idle");
  const [elevenlabsDashboardUrl, setElevenlabsDashboardUrl] = useState<string | null>(null);
  const [phoneCallStatus, setPhoneCallStatus] = useState<"idle" | "calling" | "success" | "error">("idle");
  const [phoneCallError, setPhoneCallError] = useState<string | null>(null);

  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  chatHistoryRef.current = chatHistory;
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    startSession,
    endSession,
    status: elevenlabsStatus,
    isSpeaking: elevenlabsIsSpeaking,
  } = useConversation({
    onMessage: (props: { message: string; role: "user" | "agent" }) => {
      setChatHistory((h) => [...h, { role: props.role === "agent" ? "assistant" : "user", content: props.message }]);
    },
    onError: (message: string) => {
      setChatError(message || "Voice connection error");
      setVoiceConnecting(false);
    },
    onDisconnect: () => {
      setVoiceStatus("idle");
      setVoiceConnecting(false);
    },
  });

  const getConfigPayload = useCallback(
    (): Omit<AgentConfig, "updatedAt"> => ({
      id: agentId,
      slug: agentSlug,
      provider,
      model,
      temperature,
      firstMessage,
      waitBeforeSpeaking,
      objective,
      prompt,
      selectedTools,
      libraryAccess,
      elevenlabsVoiceId: elevenlabsVoiceId.trim() || undefined,
      callEndPrompt,
      callEndMessageType,
      callEndMessage: callEndMessage.trim() || undefined,
      uninterruptibleReasons: uninterruptibleReasons.length > 0 ? uninterruptibleReasons : undefined,
    }),
    [
      agentId,
      agentSlug,
      provider,
      model,
      temperature,
      firstMessage,
      waitBeforeSpeaking,
      objective,
      prompt,
      selectedTools,
      libraryAccess,
      elevenlabsVoiceId,
      callEndPrompt,
      callEndMessageType,
      callEndMessage,
      uninterruptibleReasons,
    ]
  );

  useEffect(() => {
    if (elevenlabsStatus !== "connected") return;
    setVoiceStatus(elevenlabsIsSpeaking ? "speaking" : "listening");
  }, [elevenlabsStatus, elevenlabsIsSpeaking]);

  // Auto-scroll chat to show latest message
  useEffect(() => {
    const el = chatScrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as AgentConfig;
        if (cancelled) return;
        setProvider(data.provider ?? "openai");
        setModel(data.model ?? "gpt-4.1-mini");
        setTemperature(data.temperature ?? 0.7);
        setFirstMessage(data.firstMessage ?? "");
        setWaitBeforeSpeaking(data.waitBeforeSpeaking ?? 0);
        setObjective(data.objective ?? "");
        setPrompt(data.prompt ?? DEFAULT_PROMPT);
        setSelectedTools(data.selectedTools ?? []);
        setLibraryAccess(data.libraryAccess ?? "disabled");
        setElevenlabsVoiceId(data.elevenlabsVoiceId ?? "");
        setCallEndPrompt(
          data.callEndPrompt ??
            "Use this to end the call when the task is complete, the user asks to hang up, is busy, unresponsive, sends to voicemail, is abusive, provides a time to call back later, or when explicitly instructed in the prompt."
        );
        setCallEndMessageType(data.callEndMessageType ?? "dynamic");
        setCallEndMessage(data.callEndMessage ?? "");
        setUninterruptibleReasons(data.uninterruptibleReasons ?? ["voicemail"]);
        setElevenlabsDashboardUrl(
          data.elevenlabsAgentId
            ? `https://elevenlabs.io/app/conversational-ai/${data.elevenlabsAgentId}`
            : null
        );
      } catch {
        // keep defaults
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const handleSaveDraft = async () => {
    setSaveStatus("saving");
    setChatError(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getConfigPayload()),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setSaveStatus("error");
      setChatError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleSyncToElevenLabs = async () => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/sync-elevenlabs`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncStatus("success");
      setSyncError(null);
      if (data.dashboardUrl) setElevenlabsDashboardUrl(data.dashboardUrl);
      setTimeout(() => setSyncStatus("idle"), 4000);
    } catch (e) {
      setSyncStatus("error");
      const msg = e instanceof Error ? e.message : "Sync failed";
      setSyncError(msg);
      setChatError(msg);
    }
  };

  const handleUnlinkElevenLabs = async () => {
    if (unlinkStatus === "unlinking") return;
    setUnlinkStatus("unlinking");
    setSyncError(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/unlink-elevenlabs`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unlink failed");
      setElevenlabsDashboardUrl(null);
      setSyncStatus("idle");
      setChatError(null);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setUnlinkStatus("idle");
    }
  };

  const handleStartPhoneCall = async () => {
    const num = phoneNumber.trim();
    if (!num || phoneCallStatus === "calling") return;
    setPhoneCallStatus("calling");
    setPhoneCallError(null);
    let contextVars: Record<string, string> | undefined;
    if (contextVariables.trim() && !contextVariablesJsonError) {
      try {
        const parsed = JSON.parse(contextVariables) as Record<string, unknown>;
        if (typeof parsed === "object" && parsed !== null) {
          contextVars = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
              contextVars[k] = String(v);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/start-phone-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: num,
          ...(contextVars && Object.keys(contextVars).length > 0 && { contextVariables: contextVars }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start call");
      setPhoneCallStatus("success");
      setTimeout(() => setPhoneCallStatus("idle"), 3000);
    } catch (e) {
      setPhoneCallStatus("error");
      setPhoneCallError(e instanceof Error ? e.message : "Failed to start call");
    }
  };

  const handleSendChat = async () => {
    const msg = chatMessage.trim();
    if (!msg || chatLoading) return;
    setChatMessage("");
    setChatError(null);
    setChatLoading(true);
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);

    let contextVars: Record<string, string> | undefined;
    try {
      if (contextVariables.trim()) {
        contextVars = JSON.parse(contextVariables) as Record<string, string>;
      }
    } catch {
      // ignore invalid JSON
    }

    try {
      const saveRes = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getConfigPayload()),
      });
      if (!saveRes.ok) {
        console.warn("Could not save config before chat", await saveRes.text());
      }
      const chatRes = await fetch(`/api/agents/${encodeURIComponent(agentId)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: newHistory.slice(0, -1),
          contextVariables: contextVars,
        }),
      });
      const data = await chatRes.json();
      if (!chatRes.ok) {
        throw new Error(data.error ?? "Chat failed");
      }
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Chat failed");
      setChatHistory(newHistory.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  // Keep prompt textarea expanded to full content height (re-run when switching back to Think)
  useEffect(() => {
    if (activeSection !== "think") return;
    const run = () => {
      const el = promptTextareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
    };
    run();
    const id = requestAnimationFrame(() => run());
    return () => cancelAnimationFrame(id);
  }, [prompt, activeSection]);

  function substituteContextVars(text: string, jsonStr: string): string {
    const trimmed = jsonStr.trim();
    if (!trimmed) return text;
    let vars: Record<string, string> = {};
    try {
      vars = JSON.parse(trimmed) as Record<string, string>;
    } catch {
      return text;
    }
    if (typeof vars !== "object" || vars === null) return text;
    return text.replace(/\$\{(\w+)\}/g, (_, key) => {
      const k = key.trim();
      const val = vars[k] ?? vars[k.replace(/_/g, " ")];
      return val != null ? String(val) : `\${${key}}`;
    });
  }

  const handleVoiceToggle = useCallback(async () => {
    if (elevenlabsStatus === "connected") {
      await endSession();
      return;
    }
    setChatError(null);
    setVoiceConnecting(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/elevenlabs-signed-url`);
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error ?? "Could not start voice. Sync to ElevenLabs first.");
        setVoiceConnecting(false);
        return;
      }
      const signedUrl = data.signed_url as string;
      // Parse context variables so ${customer_name}, ${size}, etc. are replaced in the agent's first message and prompt
      let dynamicVariables: Record<string, string | number | boolean> | undefined;
      if (contextVariables.trim()) {
        try {
          const parsed = JSON.parse(contextVariables) as Record<string, unknown>;
          if (parsed && typeof parsed === "object") {
            dynamicVariables = {};
            for (const [k, v] of Object.entries(parsed)) {
              const key = k.toLowerCase().replace(/\s+/g, "_");
              if (v === null || v === undefined) continue;
              if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                dynamicVariables[key] = v;
              } else {
                dynamicVariables[key] = String(v);
              }
            }
          }
        } catch {
          // ignore invalid JSON; start without variables
        }
      }
      await startSession({
        signedUrl,
        connectionType: "websocket",
        ...(dynamicVariables && Object.keys(dynamicVariables).length > 0 ? { dynamicVariables } : {}),
      });
      setVoiceStatus("listening");
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Voice connection failed");
    } finally {
      setVoiceConnecting(false);
    }
  }, [agentId, elevenlabsStatus, endSession, startSession, contextVariables]);

  const copyConfigId = () => {
    navigator.clipboard.writeText(agentSlug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-header shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Back to agents"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Agent Editor</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className={`px-3 py-1.5 text-sm rounded-md border border-border ${
                activeTab === "config"
                  ? "bg-pill text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              Config
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("test")}
              className={`px-3 py-1.5 text-sm rounded-md border border-border ${
                activeTab === "test"
                  ? "bg-pill text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              Test
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pill border border-border">
            <span className="text-sm text-muted font-mono">{agentSlug}</span>
            <button
              type="button"
              onClick={copyConfigId}
              className="p-1 rounded text-muted hover:text-white"
              aria-label="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && (
              <span className="text-xs text-green-400">Copied</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-2 text-sm rounded-lg border ${
                activeTab === "test"
                  ? "bg-pill text-white border-border"
                  : "border-border text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              Simulation
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:bg-white/5"
            >
              Revert
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveStatus === "saving"}
              className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:bg-white/5 disabled:opacity-50"
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved"
                  : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={handleSyncToElevenLabs}
              disabled={syncStatus === "syncing"}
              className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:bg-white/5 disabled:opacity-50 flex items-center gap-2"
              title="Sync first message and prompt to ElevenLabs so the voice agent in the dashboard uses the same config"
            >
              <Volume2 className="w-4 h-4" />
              {syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "success"
                  ? "Synced"
                  : "Sync to ElevenLabs"}
            </button>
            {syncError && (
              <span className="text-xs text-red-400 max-w-[280px]" title={syncError}>
                {syncError}
              </span>
            )}
            {elevenlabsDashboardUrl && (
              <a
                href={elevenlabsDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:bg-white/5"
              >
                Open in ElevenLabs
              </a>
            )}
            {elevenlabsDashboardUrl && (
              <button
                type="button"
                onClick={handleUnlinkElevenLabs}
                disabled={unlinkStatus === "unlinking"}
                className="px-3 py-2 text-xs rounded-lg border border-border text-muted hover:text-amber-400 hover:border-amber-500/50 disabled:opacity-50"
                title="Clear linked agent so next Sync creates a new one (e.g. after switching ElevenLabs account)"
              >
                {unlinkStatus === "unlinking" ? "Unlinking…" : "Unlink (new account)"}
              </button>
            )}
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-lg bg-pillActive text-white hover:opacity-90"
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {activeTab === "config" && (
          <>
            {/* Editor left sidebar */}
            <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col py-3">
              {EDITOR_NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    activeSection === id
                      ? "bg-white/10 text-white"
                      : "text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </aside>

            {/* Main content - Think Settings only for now */}
            <main className="flex-1 min-h-0 overflow-auto p-6">
          {activeSection === "think" && (
            <div className="w-full space-y-8">
              {/* Provider, Model, Temperature */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-white">
                  LLM Configuration
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted mb-1.5">
                      Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">
                      Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive"
                    >
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">
                      Temperature
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      step={0.01}
                      value={temperature}
                      onChange={(e) =>
                        setTemperature(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </section>

              {/* Introduction */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-white">
                  Introduction
                </h2>
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    First Message
                  </label>
                  <textarea
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive resize-y"
                    placeholder="First message when the call starts..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Wait before speaking
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={waitBeforeSpeaking}
                    onChange={(e) =>
                      setWaitBeforeSpeaking(Number(e.target.value))
                    }
                    className="w-full max-w-[120px] px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Agent will wait for this duration (seconds) at the start of
                    the call before speaking.
                  </p>
                </div>
              </section>

              {/* Agent Guidelines */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-white">
                  Agent Guidelines
                </h2>
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Objective
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive resize-y"
                    placeholder="What is the agent's main objective?"
                  />
                </div>
              </section>

              {/* Prompt */}
              <section className="space-y-4">
                <label className="block text-sm font-medium text-white">
                  Prompt
                </label>
                <textarea
                  ref={promptTextareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={14}
                  className="w-full min-h-[320px] px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive resize-y overflow-auto"
                  placeholder="### Role:&#10;..."
                />
              </section>

              {/* ElevenLabs voice */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-white">
                  ElevenLabs voice
                </h2>
                <div>
                  <label className="block text-xs text-muted mb-1.5">
                    Voice ID
                  </label>
                  <input
                    type="text"
                    value={elevenlabsVoiceId}
                    onChange={(e) => setElevenlabsVoiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm font-mono placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive"
                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Pick a voice from{" "}
                    <a
                      href="https://elevenlabs.io/app/voice-library"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pillActive hover:underline"
                    >
                      Voice Library
                    </a>
                    , copy its ID, and paste here. Leave empty for default. Then{" "}
                    <strong>Save Draft</strong> and <strong>Sync to ElevenLabs</strong>.
                  </p>
                </div>
              </section>

              {/* Tools */}
              <section className="space-y-4">
                <h2 className="text-xs font-medium text-muted uppercase tracking-wide">
                  Tools
                </h2>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    Add Tools
                  </h3>
                  <p className="text-xs text-muted">
                    Add tools that agent can use during call to take actions or
                    fetch information.
                  </p>
                  <select
                    value={selectedTools[0] ?? ""}
                    onChange={(e) =>
                      setSelectedTools(
                        e.target.value ? [e.target.value] : []
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center] pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238b949e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    }}
                  >
                    <option value="">Select add tools</option>
                    <option value="crm">CRM</option>
                    <option value="ticket">Create Ticket</option>
                    <option value="calendar">Calendar</option>
                  </select>
                </div>
              </section>

              {/* Library */}
              <section className="space-y-4">
                <h2 className="text-xs font-medium text-muted uppercase tracking-wide">
                  Library
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <h3 className="text-sm font-semibold text-white">
                      Library access
                    </h3>
                    <p className="text-xs text-muted">
                      Allow agent to access library for contextual retrieval
                      during conversation.
                    </p>
                  </div>
                  <select
                    value={libraryAccess}
                    onChange={(e) =>
                      setLibraryAccess(
                        e.target.value as "enabled" | "disabled"
                      )
                    }
                    className="w-full sm:w-40 shrink-0 px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center] pr-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238b949e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    }}
                  >
                    <option value="disabled">disabled</option>
                    <option value="enabled">enabled</option>
                  </select>
                </div>
              </section>
            </div>
          )}
          {activeSection === "call-end" && (
            <div className="w-full space-y-8">
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-white">Prompt</h2>
                <p className="text-xs text-muted">
                  Explain when the agent should end a call.
                </p>
                <textarea
                  value={callEndPrompt}
                  onChange={(e) => setCallEndPrompt(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive resize-y"
                  placeholder="e.g. End when the task is complete, user asks to hang up, is busy, unresponsive..."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-white">Message</h2>
                  <select
                    value={callEndMessageType}
                    onChange={(e) =>
                      setCallEndMessageType(e.target.value as "dynamic" | "static")
                    }
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-pill border border-border text-white text-xs focus:outline-none focus:ring-2 focus:ring-pillActive"
                  >
                    <option value="dynamic">dynamic</option>
                    <option value="static">static</option>
                  </select>
                </div>
                <p className="text-xs text-muted">
                  A short, context-aware message played before ending the call. It should match the situation and provide a polite, relevant closing to the conversation.
                </p>
                <input
                  type="text"
                  value={callEndMessage}
                  onChange={(e) => setCallEndMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive"
                  placeholder="e.g. Thank you for your time. Have a great day!"
                />
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-medium text-white">Uninterruptible Reasons</h2>
                <p className="text-xs text-muted">
                  Reasons that the agent should not be interrupted.
                </p>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-pill border border-border min-h-[44px]">
                  {uninterruptibleReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-sm text-white"
                    >
                      {reason}
                      <button
                        type="button"
                        onClick={() =>
                          setUninterruptibleReasons((prev) =>
                            prev.filter((r) => r !== reason)
                          )
                        }
                        className="p-0.5 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-pillActive"
                        aria-label={`Remove ${reason}`}
                      >
                        <X className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={uninterruptibleReasonInput}
                    onChange={(e) => setUninterruptibleReasonInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const v = uninterruptibleReasonInput.trim().toLowerCase();
                        if (v && !uninterruptibleReasons.includes(v)) {
                          setUninterruptibleReasons((prev) => [...prev, v]);
                          setUninterruptibleReasonInput("");
                        }
                      }
                    }}
                    onBlur={() => {
                      const v = uninterruptibleReasonInput.trim().toLowerCase();
                      if (v && !uninterruptibleReasons.includes(v)) {
                        setUninterruptibleReasons((prev) => [...prev, v]);
                        setUninterruptibleReasonInput("");
                      }
                    }}
                    className="flex-1 min-w-[120px] px-2 py-1 bg-transparent text-white text-sm placeholder:text-muted focus:outline-none"
                    placeholder="Add reason..."
                  />
                </div>
              </section>
            </div>
          )}
          {activeSection !== "think" && activeSection !== "call-end" && (
            <div className="text-muted text-sm py-8">
              Section &quot;{EDITOR_NAV.find((n) => n.id === activeSection)?.label}&quot; coming soon.
            </div>
          )}
            </main>
          </>
        )}

        {/* Test tab: left panel + voice + chat */}
        {activeTab === "test" && (
          <div className="flex flex-1 min-h-0 overflow-hidden w-full">
            {/* Left panel - config / phone */}
            <aside className="w-72 shrink-0 border-r border-border bg-sidebar flex flex-col p-4 gap-4 overflow-auto">
              <div>
                <label className="block text-xs text-muted mb-1.5">Draft</label>
                <select
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-pillActive appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center] pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238b949e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  }}
                >
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Phone</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pill border border-border">
                  <span className="text-lg" role="img" aria-label="India">🇮🇳</span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91"
                    className="flex-1 min-w-0 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <label className="block text-xs text-muted mb-1.5">Context variables (JSON)</label>
                <textarea
                  value={contextVariables}
                  onChange={(e) => setContextVariables(e.target.value)}
                  placeholder='e.g. {"customer_name": "Saksham", "size": "48x60", "Custom Order": "yes"}'
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg bg-pill border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-pillActive resize-y font-mono ${
                    contextVariablesJsonError
                      ? "border-red-500/70 focus:ring-red-500/50"
                      : "border-border focus:ring-pillActive"
                  }`}
                />
                {contextVariablesJsonError ? (
                  <p className="mt-1.5 text-xs text-red-400">{contextVariablesJsonError}</p>
                ) : contextVariables.trim() !== "" ? (
                  <p className="mt-1.5 text-xs text-emerald-500/90">Valid JSON — will be sent with chat and voice.</p>
                ) : null}
                <p className="mt-1.5 text-xs text-muted">
                  Replaces $&#123;customer_name&#125;, $&#123;size&#125;, etc. in the agent. Enter a JSON object, then use Chat or the mic. Keys with spaces become snake_case. <strong>Sync to ElevenLabs</strong> in Config to register new placeholders.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartPhoneCall}
                disabled={!phoneNumber.trim() || phoneCallStatus === "calling"}
                className="w-full py-2.5 rounded-lg bg-pill border border-border text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {phoneCallStatus === "calling"
                  ? "Calling…"
                  : phoneCallStatus === "success"
                    ? "Call started"
                    : "Start Phone Call"}
              </button>
              {phoneCallError && (
                <p className="text-xs text-red-400 mt-1.5">{phoneCallError}</p>
              )}
            </aside>

            {/* Center - voice / mic (ElevenLabs Conversational AI) */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={voiceConnecting}
                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                      elevenlabsStatus === "connected"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-pink-500 hover:bg-pink-600"
                    } disabled:opacity-70`}
                    aria-label={elevenlabsStatus === "connected" ? "Stop voice" : "Start voice"}
                  >
                    <Mic className="w-12 h-12 text-white" />
                  </button>
                  <span className="text-sm text-muted text-center mt-2">
                    {voiceConnecting && "Connecting…"}
                    {!voiceConnecting && elevenlabsStatus !== "connected" && "click to start (ElevenLabs)"}
                    {!voiceConnecting && elevenlabsStatus === "connected" && !elevenlabsIsSpeaking && "Listening… say something"}
                    {!voiceConnecting && elevenlabsStatus === "connected" && elevenlabsIsSpeaking && "Speaking…"}
                  </span>
            </div>

            {/* Right panel - chat */}
            <aside className="w-[400px] shrink-0 border-l border-border bg-sidebar flex flex-col min-h-0">
              <div
                ref={chatScrollContainerRef}
                className="flex-1 min-h-0 overflow-auto p-4 space-y-3"
              >
                {chatHistory.length === 0 ? (
                  <p className="text-muted text-sm text-center py-12">
                    Chat with your agent here.
                  </p>
                ) : (
                  chatHistory.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-pillActive/20 text-white ml-auto max-w-[85%]"
                          : "bg-pill text-muted max-w-[85%]"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatError && (
                  <p className="text-red-400 text-xs">{chatError}</p>
                )}
              </div>
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pill border border-border">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="flex-1 min-w-0 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted"
                    disabled={chatLoading}
                  />
                  <button
                    type="button"
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim() || chatLoading}
                    className="p-1.5 rounded text-muted hover:text-white disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={!chatMessage.trim() || chatLoading}
                  className="w-full py-2.5 rounded-lg bg-pill border border-border text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {chatLoading ? "..." : "Start Chat"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
