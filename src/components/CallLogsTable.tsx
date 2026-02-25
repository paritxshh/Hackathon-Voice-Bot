"use client";

import { Phone, PhoneOff, Clock } from "lucide-react";

export type CallLogEntry = {
  id: string;
  dateTime: string;
  agentName: string;
  contact: string;
  duration: string;
  status: "completed" | "missed" | "no-answer" | "failed";
};

const callLogs: CallLogEntry[] = [
  {
    id: "1",
    dateTime: "25 Feb 2025, 10:32 AM",
    agentName: "size confirmation",
    contact: "+1 555 0123",
    duration: "2:34",
    status: "completed",
  },
  {
    id: "2",
    dateTime: "25 Feb 2025, 09:15 AM",
    agentName: "size confirmation",
    contact: "+1 555 0456",
    duration: "—",
    status: "missed",
  },
  {
    id: "3",
    dateTime: "24 Feb 2025, 4:08 PM",
    agentName: "size confirmation",
    contact: "Web (Anonymous)",
    duration: "5:12",
    status: "completed",
  },
  {
    id: "4",
    dateTime: "24 Feb 2025, 11:20 AM",
    agentName: "size confirmation",
    contact: "+1 555 0789",
    duration: "0:45",
    status: "no-answer",
  },
  {
    id: "5",
    dateTime: "23 Feb 2025, 3:45 PM",
    agentName: "size confirmation",
    contact: "+1 555 0321",
    duration: "—",
    status: "failed",
  },
];

function StatusBadge({ status }: { status: CallLogEntry["status"] }) {
  const styles: Record<CallLogEntry["status"], { className: string; label: string }> = {
    completed: {
      className: "bg-emerald-500/20 text-emerald-400",
      label: "Completed",
    },
    missed: {
      className: "bg-amber-500/20 text-amber-400",
      label: "Missed",
    },
    "no-answer": {
      className: "bg-muted/20 text-muted",
      label: "No answer",
    },
    failed: {
      className: "bg-red-500/20 text-red-400",
      label: "Failed",
    },
  };
  const { className, label } = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {status === "completed" && <Phone className="w-3 h-3" />}
      {(status === "missed" || status === "no-answer") && <PhoneOff className="w-3 h-3" />}
      {status === "failed" && <PhoneOff className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function CallLogsTable() {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-surface">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-row/50">
            <th className="px-4 py-3 text-sm font-medium text-white">
              Date & time
            </th>
            <th className="px-4 py-3 text-sm font-medium text-white">
              Agent
            </th>
            <th className="px-4 py-3 text-sm font-medium text-white">
              Contact
            </th>
            <th className="px-4 py-3 text-sm font-medium text-white">
              Duration
            </th>
            <th className="px-4 py-3 text-sm font-medium text-white">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {callLogs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border last:border-0 hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-4 py-3 text-white text-sm">
                {log.dateTime}
              </td>
              <td className="px-4 py-3 text-white text-sm">
                {log.agentName}
              </td>
              <td className="px-4 py-3 text-muted text-sm">
                {log.contact}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {log.duration}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={log.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
