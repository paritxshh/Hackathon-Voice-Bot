import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents-store";
import { startZegoOutboundCall } from "@/lib/zego-outbound";
import { startElevenLabsTwilioOutboundCall } from "@/lib/elevenlabs-twilio-outbound";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/agents/[id]/start-phone-call
 *
 * Starts an outbound phone call. Prefers ElevenLabs + Twilio when configured;
 * otherwise falls back to Zego.
 *
 * Body: { "phoneNumber": "+91 9876543210", "contextVariables"?: { "customer_name": "..." } }
 *
 * ElevenLabs+Twilio (preferred): ELEVENLABS_API_KEY, ELEVENLABS_TWILIO_PHONE_NUMBER_ID
 * Zego fallback: ZEGO_APP_ID, ZEGO_SERVER_SECRET, ZEGO_OUTBOUND_CALL_API_URL
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const agent = getAgent(decodedId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  let body: { phoneNumber?: string; contextVariables?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const phoneNumber = (body?.phoneNumber ?? "").trim();
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "phoneNumber is required" },
      { status: 400 }
    );
  }

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const elevenlabsPhoneNumberId = process.env.ELEVENLABS_TWILIO_PHONE_NUMBER_ID;
  const useElevenLabsTwilio =
    elevenlabsApiKey &&
    elevenlabsPhoneNumberId &&
    agent.elevenlabsAgentId;

  if (useElevenLabsTwilio) {
    const result = await startElevenLabsTwilioOutboundCall({
      apiKey: elevenlabsApiKey,
      agentId: agent.elevenlabsAgentId!,
      agentPhoneNumberId: elevenlabsPhoneNumberId,
      toNumber: phoneNumber,
      dynamicVariables: body.contextVariables,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Outbound call initiated (ElevenLabs + Twilio)",
      callId: result.callSid,
    });
  }

  // Fallback: Zego
  const appId = process.env.ZEGO_APP_ID;
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  const apiUrl = process.env.ZEGO_OUTBOUND_CALL_API_URL;

  if (!appId || !serverSecret) {
    return NextResponse.json(
      {
        error:
          "No outbound provider configured. Add ELEVENLABS_API_KEY + ELEVENLABS_TWILIO_PHONE_NUMBER_ID (and sync agent to ElevenLabs), or ZEGO_APP_ID and ZEGO_SERVER_SECRET in .env.local",
      },
      { status: 503 }
    );
  }

  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "ZEGO_OUTBOUND_CALL_API_URL is not set. Add the Zego outbound call API endpoint to .env.local (HTTPS, not wss://).",
      },
      { status: 503 }
    );
  }

  const trimmedUrl = apiUrl.trim();
  if (trimmedUrl.startsWith("ws://") || trimmedUrl.startsWith("wss://")) {
    return NextResponse.json(
      {
        error:
          "ZEGO_OUTBOUND_CALL_API_URL must be an HTTPS URL for the outbound-call REST API (e.g. https://...). You have a WebSocket URL (wss://). Use the HTTP(S) endpoint that starts a call, not the WebSocket URL.",
      },
      { status: 503 }
    );
  }

  const result = await startZegoOutboundCall({
    phoneNumber,
    appId,
    serverSecret,
    apiUrl: trimmedUrl,
    agentId: agent.elevenlabsAgentId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Outbound call initiated (Zego)",
    callId: result.callId,
  });
}
