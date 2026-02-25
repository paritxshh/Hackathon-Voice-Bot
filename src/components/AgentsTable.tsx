"use client";

import Link from "next/link";
import { FileText, ExternalLink, MoreVertical } from "lucide-react";

const agents = [
  {
    id: "sleepycat_size_confirmation_en-IN_v1",
    name: "size confirmation",
    slug: "sleepycat_size_confirmation_en-IN_v1",
    lastEditedBy: "simrat@hoomanlabs.com",
    edited: "07-07-2025 02:41 PM",
    language: "en-in",
    type: "Single Prompt",
    status: "published",
  },
];

export default function AgentsTable() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-row/50">
              <th className="px-4 py-3 text-sm font-medium text-white">
                Agent
              </th>
              <th className="px-4 py-3 text-sm font-medium text-white">
                Last Edited By
              </th>
              <th className="px-4 py-3 text-sm font-medium text-white">
                Edited
              </th>
              <th className="px-4 py-3 text-sm font-medium text-white">
                Language
              </th>
              <th className="px-4 py-3 text-sm font-medium text-white">
                Type
              </th>
              <th className="px-4 py-3 text-sm font-medium text-white">
                Status
              </th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-medium">
                      {agent.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {agent.slug}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white text-sm">
                  {agent.lastEditedBy}
                </td>
                <td className="px-4 py-3 text-white text-sm">
                  {agent.edited}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pill text-muted">
                    {agent.language}
                  </span>
                </td>
                <td className="px-4 py-3 text-white text-sm">
                  {agent.type}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pillActive/20 text-blue-400">
                    {agent.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/agents/${agent.id}/edit`}
                      className="p-1.5 rounded text-muted hover:text-white hover:bg-white/10 transition-colors inline-flex"
                      aria-label="Open editor"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-1.5 rounded text-muted hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
