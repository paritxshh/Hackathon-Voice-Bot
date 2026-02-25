"use client";

import { Plus } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-header border-b border-border">
      <h1 className="text-xl font-semibold text-white">Agents</h1>
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pill hover:bg-white/10 text-white text-sm font-medium transition-colors">
        <Plus className="w-4 h-4" />
        Create Agent
      </button>
    </header>
  );
}
