/**
 * ElevenLabs + Twilio outbound call.
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_TWILIO_PHONE_NUMBER_ID.
 * Agent must be synced to ElevenLabs (have elevenlabsAgentId).
 * Link a Twilio number in ElevenLabs dashboard to get the phone number id.
 */

import { ElevenLabsClient } from "elevenlabs";

export type ElevenLabsTwilioOutboundResult =
  | { ok: true; callSid?: string }
  | { ok: false; error: string };

export async function startElevenLabsTwilioOutboundCall(params: {
  apiKey: string;
  agentId: string;
  agentPhoneNumberId: string;
  toNumber: string;
  /** Optional dynamic variables for ${placeholder} in prompt/first message */
  dynamicVariables?: Record<string, string>;
}): Promise<ElevenLabsTwilioOutboundResult> {
  const { apiKey, agentId, agentPhoneNumberId, toNumber, dynamicVariables } = params;
  const to = toNumber.trim().replace(/\s+/g, "");
  if (!to) {
    return { ok: false, error: "Phone number is required" };
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const body: {
      agent_id: string;
      agent_phone_number_id: string;
      to_number: string;
      conversation_initiation_client_data?: { dynamic_variables?: Record<string, string | number | boolean> };
    } = {
      agent_id: agentId,
      agent_phone_number_id: agentPhoneNumberId,
      to_number: to,
    };
    if (dynamicVariables && Object.keys(dynamicVariables).length > 0) {
      body.conversation_initiation_client_data = {
        dynamic_variables: dynamicVariables as Record<string, string | number | boolean>,
      };
    }

    const res = await client.conversationalAi.twilioOutboundCall(body);

    if (!res.success) {
      return { ok: false, error: res.message || "Outbound call failed" };
    }
    return { ok: true, callSid: res.callSid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
