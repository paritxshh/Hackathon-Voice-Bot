"use client";

import { useState } from "react";
import {
  Copy,
  RefreshCw,
  FileBarChart2,
  Plus,
  Search,
  Play,
  Pause,
  Volume2,
  Download,
  Radio,
} from "lucide-react";
import type {
  CallLogEntry,
  CallLogWithDetails,
  TranscriptMessage,
  CallDetails,
} from "@/types/call-log";

const MOCK_LOGS: CallLogWithDetails[] = [
  {
    id: "CtVHFsrhUyJZCNNj9AMy",
    dateTime: "22-07-2025 08:24 PM",
    draftName: "draft_sleepycat_size_confirmation_en-IN_v1",
    source: "Web",
    status: "unknown",
    transcript: [
      { role: "agent", content: "Hi, this is Muskaan from Sleepy Cat. Am I speaking with Saksham?", timestamp: "00:00" },
      { role: "user", content: "Yes, this is Saksham.", timestamp: "00:08" },
      { role: "agent", content: "Great! I'm calling about your recent mattress order. I need to confirm the dimensions for your mattress. Could you tell me the length and width you'd like?", timestamp: "00:12" },
      { role: "user", content: "The length is 78 inches and the width is 72 inches.", timestamp: "00:30" },
      { role: "agent", content: "Perfect, I've noted 78 inches by 72 inches. Is there anything else you'd like to update?", timestamp: "00:45" },
      { role: "user", content: "No, that's all.", timestamp: "01:00" },
      { role: "agent", content: "Thank you, Saksham. Your order is updated. Have a great day!", timestamp: "01:05" },
    ],
    details: {
      agent: "draft_sleepycat_size_confirmation_en-IN_v1",
      beginTimestamp: "Tue, 22-07-2025, 06:24:00 PM",
      duration: "00:01:40",
      provider: "web",
      endReason: "customer_end",
    },
  },
  {
    id: "SeGhKG2pLK1p1v5PnUwi",
    dateTime: "21-07-2025 03:15 PM",
    draftName: "draft_sleepycat_size_confirmation_en-IN_v1",
    source: "Web",
    status: "no_response",
    transcript: [
      { role: "agent", content: "Hi, this is Muskaan from Sleepy Cat. Am I speaking with the customer?", timestamp: "00:00" },
      { role: "user", content: "Hello?", timestamp: "00:05" },
      { role: "agent", content: "I'm calling about your mattress order. Could you confirm the size?", timestamp: "00:10" },
    ],
    details: {
      agent: "draft_sleepycat_size_confirmation_en-IN_v1",
      beginTimestamp: "Tue, 21-07-2025, 03:15:00 PM",
      duration: "00:00:45",
      provider: "web",
      endReason: "no_response",
    },
  },
];

function TranscriptMessageRow({ msg }: { msg: TranscriptMessage }) {
  const isAgent = msg.role === "agent";
  return (
    <div
      className={`flex gap-3 ${isAgent ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
          isAgent
            ? "bg-pill text-white"
            : "bg-white/10 text-white"
        }`}
      >
        <p className="text-xs text-muted mb-1">{msg.timestamp}</p>
        <p className="text-sm">{msg.content}</p>
      </div>
    </div>
  );
}

function AudioPlayer({ duration = "1:41" }: { duration?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-pill/50 border border-border">
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-muted">0:00</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-0 bg-pillActive rounded-full" />
        </div>
        <span className="text-xs text-muted">{duration}</span>
      </div>
      <button
        type="button"
        className="p-2 rounded text-muted hover:text-white"
        aria-label="Volume"
      >
        <Volume2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-2 rounded text-muted hover:text-white"
        aria-label="Download"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

function DetailsTab({ details }: { details: CallDetails }) {
  const entries = [
    { key: "agent", value: details.agent },
    { key: "beginTimestamp", value: details.beginTimestamp },
    { key: "duration", value: details.duration },
    { key: "provider", value: details.provider },
    { key: "endReason", value: details.endReason },
  ];
  return (
    <div className="space-y-2">
      {entries.map(({ key, value }) => (
        <div key={key} className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">{key}</span>
          <span className="text-sm text-white font-mono break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CallLogsView() {
  const [searchId, setSearchId] = useState("");
  const [selected, setSelected] = useState<CallLogWithDetails | null>(
    MOCK_LOGS[0] ?? null
  );
  const [detailTab, setDetailTab] = useState<"Details" | "Analysis" | "Stats" | "Variables">("Details");
  const [feedback, setFeedback] = useState("");

  const filteredLogs = searchId.trim()
    ? MOCK_LOGS.filter((log) =>
        log.id.toLowerCase().includes(searchId.trim().toLowerCase())
      )
    : MOCK_LOGS;

  const copyId = () => {
    if (selected?.id) {
      navigator.clipboard.writeText(selected.id);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Top bar: title, search, actions — no Overall/Inbound/Outbound/Web */}
      <header className="flex items-center justify-between gap-4 h-14 px-6 border-b border-border bg-header shrink-0">
        <h1 className="text-xl font-semibold text-white">Call Logs</h1>
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by conversation ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pill hover:bg-white/10 text-white text-sm font-medium transition-colors"
          >
            <FileBarChart2 className="w-4 h-4" />
            Report
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pill hover:bg-white/10 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Scenario
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Three panels — no filter row above the list */}
      <div className="flex flex-1 min-h-0">
        {/* Left: call log list */}
        <div className="w-80 shrink-0 border-r border-border flex flex-col overflow-hidden bg-surface">
          <div className="flex-1 overflow-y-auto p-2">
            {filteredLogs.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setSelected(log)}
                className={`w-full text-left rounded-lg p-3 mb-1.5 transition-colors ${
                  selected?.id === log.id
                    ? "bg-white/10 ring-1 ring-white/20"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate font-mono">
                      {log.id}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{log.dateTime}</p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {log.draftName}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted">{log.source}</span>
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-pill text-muted">
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: transcript + audio + feedback */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-surface overflow-hidden">
          {selected ? (
            <>
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <AudioPlayer
                  duration={
                    selected.details?.duration
                      ? selected.details.duration.replace(/^00:/, "")
                      : "1:41"
                  }
                />
                <div className="space-y-3">
                  {selected.transcript?.map((msg, i) => (
                    <TranscriptMessageRow key={i} msg={msg} />
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-border shrink-0">
                <p className="text-xs font-medium text-muted mb-2">Feedback</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Provide feedback to your agent here..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-pill border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-pillActive text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a call to view transcript
            </div>
          )}
        </div>

        {/* Right: call details */}
        <div className="w-80 shrink-0 flex flex-col bg-surface overflow-hidden">
          {selected ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white truncate">
                    {selected.id}
                  </span>
                  <button
                    type="button"
                    onClick={copyId}
                    className="p-1 rounded text-muted hover:text-white"
                    aria-label="Copy ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="border-b border-border">
                <div className="flex gap-0">
                  {(["Details", "Analysis", "Stats", "Variables"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setDetailTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                          detailTab === tab
                            ? "text-white border-b-2 border-pillActive"
                            : "text-muted hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {detailTab === "Details" && selected.details && (
                  <DetailsTab details={selected.details} />
                )}
                {detailTab === "Analysis" && (
                  <p className="text-sm text-muted">Analysis content placeholder.</p>
                )}
                {detailTab === "Stats" && (
                  <p className="text-sm text-muted">Stats content placeholder.</p>
                )}
                {detailTab === "Variables" && (
                  <p className="text-sm text-muted">Variables content placeholder.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm p-4">
              Select a call to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
