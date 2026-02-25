import type { AgentConfig, ChatMessage } from "./agent-types";

/** Map our dropdown model ids to OpenAI API model ids (for aliases / dated variants). */
const OPENAI_MODEL_MAP: Record<string, string> = {
  "gpt-4.1-mini": "gpt-4o-mini",
  "gpt-4.1-nano": "gpt-4o-mini",
  "gpt-4.1": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  "gpt-4-turbo": "gpt-4-turbo",
  "gpt-4": "gpt-4",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
  "gpt-4o-2024-08-06": "gpt-4o-2024-08-06",
  "gpt-4o-2024-05-13": "gpt-4o-2024-05-13",
  "gpt-4o-mini-2024-07-18": "gpt-4o-mini-2024-07-18",
};

/**
 * Build system prompt for the LLM from agent config.
 */
function buildSystemPrompt(config: AgentConfig): string {
  const parts: string[] = [];
  if (config.objective) {
    parts.push(`Objective: ${config.objective}`);
  }
  parts.push(config.prompt);
  return parts.join("\n\n");
}

function substituteVariables(
  text: string,
  vars: Record<string, string> | undefined
): string {
  if (!vars || Object.keys(vars).length === 0) return text;
  return text.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `${key}`);
}

/**
 * Call OpenAI (or configured provider) to get the next reply.
 */
export async function getAgentReply(
  config: AgentConfig,
  userMessage: string,
  history: ChatMessage[] = [],
  contextVariables?: Record<string, string>
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const systemPrompt = substituteVariables(
    buildSystemPrompt(config),
    contextVariables
  );
  const firstMessage = substituteVariables(
    config.firstMessage,
    contextVariables
  );
  const model = OPENAI_MODEL_MAP[config.model] ?? config.model ?? "gpt-4o-mini";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // If we have a first message and no history, seed the conversation so the agent "said" it first
  if (firstMessage && history.length === 0) {
    messages.push({ role: "assistant", content: firstMessage });
  }

  for (const m of history) {
    messages.push({
      role: m.role,
      content: m.content,
    });
  }
  messages.push({ role: "user", content: userMessage });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: config.temperature,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (content === undefined || content === null) {
    throw new Error("Empty reply from OpenAI");
  }
  return content;
}
