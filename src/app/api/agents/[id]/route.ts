import { NextRequest, NextResponse } from "next/server";
import { getAgent, saveAgent } from "@/lib/agents-store";
import type { AgentConfig } from "@/lib/agent-types";

type RouteParams = { params: Promise<{ id: string }> };

function defaultAgentForId(id: string): AgentConfig {
  const name = id.replace(/_/g, " ").replace(/-/g, " ");
  return {
    id,
    slug: id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
    firstMessage: "",
    waitBeforeSpeaking: 0,
    objective: "",
    prompt: "",
    selectedTools: [],
    libraryAccess: "disabled",
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  let agent = getAgent(decodedId);
  if (!agent) {
    agent = saveAgent(defaultAgentForId(decodedId));
  }
  return NextResponse.json(agent);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  let body: Partial<AgentConfig> & { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const agent = getAgent(decodedId);
  const merged: AgentConfig = {
    id: decodedId,
    provider: body.provider ?? agent?.provider ?? "openai",
    model: body.model ?? agent?.model ?? "gpt-4o-mini",
    temperature: body.temperature ?? agent?.temperature ?? 0.7,
    firstMessage: body.firstMessage ?? agent?.firstMessage ?? "",
    waitBeforeSpeaking: body.waitBeforeSpeaking ?? agent?.waitBeforeSpeaking ?? 0,
    objective: body.objective ?? agent?.objective ?? "",
    prompt: body.prompt ?? agent?.prompt ?? "",
    selectedTools: body.selectedTools ?? agent?.selectedTools ?? [],
    libraryAccess: body.libraryAccess ?? agent?.libraryAccess ?? "disabled",
    name: body.name ?? agent?.name,
    slug: body.slug ?? agent?.slug ?? decodedId,
    elevenlabsAgentId: body.elevenlabsAgentId ?? agent?.elevenlabsAgentId,
    elevenlabsVoiceId: body.elevenlabsVoiceId ?? agent?.elevenlabsVoiceId,
    callEndPrompt: body.callEndPrompt ?? agent?.callEndPrompt,
    callEndMessageType: body.callEndMessageType ?? agent?.callEndMessageType ?? "dynamic",
    callEndMessage: body.callEndMessage ?? agent?.callEndMessage,
    uninterruptibleReasons: body.uninterruptibleReasons ?? agent?.uninterruptibleReasons ?? [],
  };
  const saved = saveAgent(merged);
  return NextResponse.json(saved);
}
