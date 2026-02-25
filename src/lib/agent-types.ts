/**
 * Agent configuration shape - matches the Think Settings (and related) form.
 * Used by the API to run the LLM with the right prompt, model, and greeting.
 */
export type AgentConfig = {
  id: string;
  name?: string;
  slug?: string;
  // LLM
  provider: string;
  model: string;
  temperature: number;
  // Introduction
  firstMessage: string;
  waitBeforeSpeaking: number;
  // Guidelines
  objective: string;
  prompt: string;
  // Tools & Library (for future use)
  selectedTools?: string[];
  libraryAccess?: "enabled" | "disabled";
  /** ElevenLabs Conversational AI agent id – set after syncing to ElevenLabs */
  elevenlabsAgentId?: string;
  /** ElevenLabs voice ID for TTS (from Voice Library). Sync again after changing. */
  elevenlabsVoiceId?: string;
  /** Call End: when the agent should end the call */
  callEndPrompt?: string;
  /** Call End: "dynamic" or "static" message before ending */
  callEndMessageType?: "dynamic" | "static";
  /** Call End: short message played before ending (static text or template) */
  callEndMessage?: string;
  /** Call End: reasons the agent should not be interrupted (e.g. voicemail) */
  uninterruptibleReasons?: string[];
  updatedAt?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  message: string;
  history?: ChatMessage[];
  /** Optional JSON object to inject into prompt placeholders (e.g. customer_name, size) */
  contextVariables?: Record<string, string>;
};

export type ChatResponse = {
  reply: string;
};
