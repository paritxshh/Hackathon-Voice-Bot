import { NextRequest, NextResponse } from "next/server";
import { getAgent, saveAgent } from "@/lib/agents-store";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/agents/[id]/unlink-elevenlabs
 *
 * Clears the stored ElevenLabs agent ID so the next "Sync to ElevenLabs"
 * will create a new agent (e.g. after switching to a different ElevenLabs account).
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const agent = getAgent(decodedId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const updated = saveAgent({
    ...agent,
    elevenlabsAgentId: undefined,
  });

  return NextResponse.json({
    ok: true,
    elevenlabsAgentId: updated.elevenlabsAgentId,
    message: "Unlinked. Click Sync to ElevenLabs to create a new agent.",
  });
}
