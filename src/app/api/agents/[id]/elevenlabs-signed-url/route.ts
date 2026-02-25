import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents-store";
import { ElevenLabsClient } from "elevenlabs";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/agents/[id]/elevenlabs-signed-url
 *
 * Returns a signed WebSocket URL for the agent's ElevenLabs voice conversation.
 * Used by the Test tab "click to start mic" when the agent is synced to ElevenLabs.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not set" },
      { status: 503 }
    );
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const agent = getAgent(decodedId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const elevenlabsAgentId = agent.elevenlabsAgentId;
  if (!elevenlabsAgentId) {
    return NextResponse.json(
      { error: "Agent not synced to ElevenLabs. Use Sync to ElevenLabs first." },
      { status: 400 }
    );
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const { signed_url } = await client.conversationalAi.getSignedUrl({
      agent_id: elevenlabsAgentId,
    });
    return NextResponse.json({ signed_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
