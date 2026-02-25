import type { AgentConfig } from "./agent-types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");

type AgentsFile = Record<string, AgentConfig>;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAgents(): AgentsFile {
  ensureDataDir();
  if (!fs.existsSync(AGENTS_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(AGENTS_FILE, "utf-8");
  try {
    return JSON.parse(raw) as AgentsFile;
  } catch {
    return {};
  }
}

function writeAgents(agents: AgentsFile) {
  ensureDataDir();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf-8");
}

export function getAgent(id: string): AgentConfig | null {
  const agents = readAgents();
  return agents[id] ?? null;
}

export function saveAgent(config: AgentConfig): AgentConfig {
  const agents = readAgents();
  const updated = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  agents[config.id] = updated;
  writeAgents(agents);
  return updated;
}

export function listAgents(): AgentConfig[] {
  const agents = readAgents();
  return Object.values(agents);
}
