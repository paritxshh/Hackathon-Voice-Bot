import { NextRequest, NextResponse } from "next/server";
import { getAgent, saveAgent } from "@/lib/agents-store";
import { syncAgentToElevenLabs } from "@/lib/elevenlabs-agent";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/agents/[id]/sync-elevenlabs
 *
 * Syncs this agent's first message and prompt to ElevenLabs Conversational AI.
 * - If the agent has no elevenlabsAgentId: creates a new ElevenLabs agent and stores its id.
 * - If it already has one: updates the existing ElevenLabs agent.
 *
 * Requires ELEVENLABS_API_KEY in the environment.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ELEVENLABS_API_KEY is not set. Add it to .env.local to sync to ElevenLabs.",
      },
      { status: 503 }
    );
  }

  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const agent = getAgent(decodedId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const result = await syncAgentToElevenLabs(agent, apiKey);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 502 }
    );
  }

  // If we created a new ElevenLabs agent, persist its id on our agent
  if (result.created) {
    const updated = saveAgent({
      ...agent,
      elevenlabsAgentId: result.agentId,
    });
    return NextResponse.json({
      ok: true,
      agentId: result.agentId,
      created: true,
      elevenlabsAgentId: updated.elevenlabsAgentId,
      dashboardUrl: `https://elevenlabs.io/app/conversational-ai/${result.agentId}`,
    });
  }

  return NextResponse.json({
    ok: true,
    agentId: result.agentId,
    created: false,
    dashboardUrl: `https://elevenlabs.io/app/conversational-ai/${result.agentId}`,
  });
}
