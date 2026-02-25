/**
 * Zego outbound call integration.
 * Requires ZEGO_APP_ID, ZEGO_SERVER_SECRET, and ZEGO_OUTBOUND_CALL_API_URL in env.
 * See Zego Voice Call / PSTN docs for the exact API endpoint and request shape.
 */

export type ZegoOutboundResult =
  | { ok: true; callId?: string }
  | { ok: false; error: string };

export async function startZegoOutboundCall(params: {
  phoneNumber: string;
  appId: string;
  serverSecret: string;
  apiUrl: string;
  /** Optional: agent/session context for the call (e.g. ElevenLabs agent id) */
  agentId?: string;
}): Promise<ZegoOutboundResult> {
  const { phoneNumber, appId, serverSecret, apiUrl, agentId } = params;
  const to = phoneNumber.trim().replace(/\s+/g, "");
  if (!to) {
    return { ok: false, error: "Phone number is required" };
  }

  try {
    const body: Record<string, unknown> = {
      app_id: Number(appId),
      server_secret: serverSecret,
      to: to,
      ...(agentId && { agent_id: agentId }),
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as {
      code?: number;
      message?: string;
      call_id?: string;
      data?: { call_id?: string; message?: string };
    };

    if (!res.ok) {
      const code = data?.code ?? res.status;
      const rawMsg =
        data?.message ?? (typeof data?.data === "object" && data?.data?.message)
          ? String((data.data as { message?: string }).message)
          : data?.data
            ? String(data.data)
            : null;
      // SIP 439 = first hop lacks outbound support (provider not configured for outbound)
      if (code === 439 || (rawMsg && String(rawMsg).includes("439"))) {
        return {
          ok: false,
          error:
            "Outbound calls not supported (439: first hop lacks outbound support). Your voice/SIP provider or Zego account may not have outbound calling enabled—check your provider dashboard or contact support.",
        };
      }
      const msg = rawMsg || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }

    // Some APIs return 200 with code 439 in body
    const code = data?.code ?? 0;
    if (code === 439) {
      return {
        ok: false,
        error:
          "Outbound calls not supported (439: first hop lacks outbound support). Your voice/SIP provider or Zego account may not have outbound calling enabled—check your provider dashboard or contact support.",
      };
    }

    const callId = data?.call_id ?? data?.data?.call_id;
    return { ok: true, callId: callId ? String(callId) : undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
