import { ElevenLabsClient, ElevenLabsError, type ElevenLabs } from "elevenlabs";
import type { AgentConfig } from "@/lib/agent-types";

function getErrorMessage(err: unknown): string {
  if (err instanceof ElevenLabsError) {
    const parts = [err.message || "ElevenLabs API error"];
    if (err.statusCode) parts.push(`Status: ${err.statusCode}`);
    if (err.body != null) {
      try {
        const body = typeof err.body === "object" && err.body !== null && "detail" in err.body
          ? (err.body as { detail?: string | { msg?: string } }).detail
          : err.body;
        const detailStr = typeof body === "string" ? body : (body && typeof body === "object" && "msg" in body ? (body as { msg: string }).msg : JSON.stringify(err.body));
        if (detailStr) parts.push(detailStr);
      } catch {
        parts.push(JSON.stringify(err.body));
      }
    }
    return parts.join(" — ");
  }
  return err instanceof Error ? err.message : String(err);
}

/** ElevenLabs LLM models that we can map from our provider/model */
const EL_LLM_MAP: Record<string, string> = {
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4.1-nano": "gpt-4.1-nano",
  "gpt-4.1": "gpt-4.1",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  "gpt-4": "gpt-4",
  "gpt-4-turbo": "gpt-4-turbo",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
  "gemini-1.5-pro": "gemini-1.5-pro",
  "gemini-1.5-flash": "gemini-1.5-flash",
  "gemini-2.0-flash-001": "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-1.0-pro": "gemini-1.0-pro",
  "claude-3-7-sonnet": "claude-3-7-sonnet",
  "claude-3-5-sonnet": "claude-3-5-sonnet",
  "claude-3-5-sonnet-v1": "claude-3-5-sonnet-v1",
  "claude-3-haiku": "claude-3-haiku",
};

/** Extract ${placeholder} names from text so we can register them with ElevenLabs */
function extractPlaceholders(text: string): string[] {
  const names = new Set<string>();
  const re = /\$\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) names.add(m[1]);
  return [...names];
}

/** Build the full agent prompt including Call End section when configured */
function buildAgentPrompt(config: AgentConfig): string {
  const main = (config.prompt || "").trim();
  const callEndPrompt = (config.callEndPrompt || "").trim();
  const callEndMessage = (config.callEndMessage || "").trim();
  const hasCallEnd = callEndPrompt.length > 0;

  if (!hasCallEnd) return main;

  const closingInstruction =
    callEndMessage.length > 0
      ? `Before ending the call, say this closing message (or a short, polite, context-aware variant): "${callEndMessage}". Then use the end_call tool to end the conversation.`
      : "Before ending, say a short, polite, context-aware closing message. Then use the end_call tool to end the conversation.";
  const uninterruptible =
    config.uninterruptibleReasons && config.uninterruptibleReasons.length > 0
      ? ` Do not be interrupted when: ${config.uninterruptibleReasons.join(", ")}.`
      : "";

  return `${main}\n\n### Call End\n${callEndPrompt}${uninterruptible}\n\n${closingInstruction}`;
}

/**
 * Build ElevenLabs conversation_config from our app's AgentConfig.
 * Uses the same first message and prompt so the voice agent in the dashboard matches.
 * Registers dynamic variable placeholders from ${...} in first message and prompt so
 * context variables sent at conversation start are substituted.
 */
export function buildElevenLabsConversationConfig(
  config: AgentConfig
): ElevenLabs.ConversationalConfig {
  const llm = EL_LLM_MAP[config.model] ?? "gpt-4.1-mini";
  const fullPrompt = buildAgentPrompt(config);
  const placeholders = [
    ...extractPlaceholders(config.firstMessage ?? ""),
    ...extractPlaceholders(fullPrompt),
  ];
  const dynamicVariablePlaceholders: Record<string, string> = {};
  for (const name of placeholders) {
    dynamicVariablePlaceholders[name] = "";
  }

  return {
    agent: {
      first_message: config.firstMessage || undefined,
      language: "en",
      ...(Object.keys(dynamicVariablePlaceholders).length > 0 && {
        dynamic_variables: {
          dynamic_variable_placeholders: dynamicVariablePlaceholders,
        },
      }),
      prompt: {
        prompt: fullPrompt,
        llm: llm as ElevenLabs.Llm,
        temperature: config.temperature,
        tools: [
          {
            type: "system",
            name: "language_detection",
            description:
              "Detect and switch to the user's language. Use when the user speaks in a different language (e.g. Hindi or English) so the agent responds in that language.",
            params: { system_tool_type: "language_detection" },
          },
          {
            type: "system",
            name: "end_call",
            description:
              "End the call after saying a short closing message. Use when the task is complete, the user asks to hang up, or when the Call End conditions in the prompt are met.",
            params: { system_tool_type: "end_call" },
          },
        ],
      },
    },
    language_presets: {
      en: { overrides: { agent: { language: "en" } } },
      hi: { overrides: { agent: { language: "hi" } } },
    },
    tts: {
      // Eleven Multilingual v2: most life-like, emotionally rich, 29 languages
      model_id: "eleven_multilingual_v2" as ElevenLabs.TtsConversationalModel,
      ...(config.elevenlabsVoiceId && { voice_id: config.elevenlabsVoiceId }),
    },
  };
}

export type SyncResult =
  | { ok: true; agentId: string; created: boolean }
  | { ok: false; error: string };

/**
 * Create or update the ElevenLabs Conversational AI agent so the dashboard
 * voice agent uses the same first message and prompt as our app.
 * Returns the ElevenLabs agent_id (and whether it was created) or an error.
 */
export async function syncAgentToElevenLabs(
  config: AgentConfig,
  apiKey: string
): Promise<SyncResult> {
  const client = new ElevenLabsClient({ apiKey });
  const conversationConfig = buildElevenLabsConversationConfig(config);
  const displayName = config.name || config.slug || config.id;

  try {
    if (config.elevenlabsAgentId) {
      await client.conversationalAi.updateAgent(
        config.elevenlabsAgentId,
        {
          conversation_config: conversationConfig,
          name: displayName,
        }
      );
      return { ok: true, agentId: config.elevenlabsAgentId, created: false };
    }

    const created = await client.conversationalAi.createAgent({
      conversation_config: conversationConfig,
      name: displayName,
      tags: ["guardian", "synced"],
    });

    const agentId = created.agent_id;
    if (!agentId) {
      return { ok: false, error: "ElevenLabs did not return an agent_id" };
    }
    return { ok: true, agentId, created: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err) };
  }
}
