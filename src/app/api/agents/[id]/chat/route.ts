import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agents-store";
import { getAgentReply } from "@/lib/chat";
import type { ChatRequest } from "@/lib/agent-types";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const agent = getAgent(decodedId);

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found. Save the agent config first (Save Draft)." },
      { status: 404 }
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { message, history = [], contextVariables } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'message' field" },
      { status: 400 }
    );
  }

  try {
    const reply = await getAgentReply(
      agent,
      message,
      history,
      contextVariables && typeof contextVariables === "object"
        ? contextVariables
        : undefined
    );
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
