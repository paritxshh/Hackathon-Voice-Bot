# Voice Agent Dashboard

A Next.js 14 app for managing **voice agents**: configure LLM prompts, first messages, call-end behavior, and sync agents to **ElevenLabs Conversational AI**. Includes a text-based Chat tab (OpenAI) and a Test tab with ElevenLabs signed-URL voice testing.

---

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS, Lucide React
- **Voice / TTS:** ElevenLabs (`elevenlabs`, `@elevenlabs/react`)
- **LLM (text chat):** OpenAI API
- **Data:** File-based storage (`.data/agents.json`), no database

---

## Project structure (merge reference)

Use this layout when copying into another repo so paths and imports stay consistent.

```
src/
├── app/
│   ├── layout.tsx              # Root layout; wraps children in ConditionalLayout
│   ├── page.tsx                # Home: Header + AgentsTable
│   ├── globals.css             # Tailwind + CSS variables (sidebar, surface, header, etc.)
│   ├── agents/
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx    # Agent edit page; renders AgentEditor
│   └── api/
│       └── agents/
│           └── [id]/
│               ├── route.ts              # GET agent, POST update agent
│               ├── chat/route.ts         # POST text chat (OpenAI)
│               ├── sync-elevenlabs/route.ts   # POST sync to ElevenLabs
│               ├── unlink-elevenlabs/route.ts # POST clear elevenlabsAgentId
│               ├── start-phone-call/route.ts  # POST outbound call (ElevenLabs+Twilio or Zego)
│               └── elevenlabs-signed-url/route.ts # GET signed URL for voice test
├── components/
│   ├── ConditionalLayout.tsx   # Shows Sidebar only when NOT on /agents/[id]/edit
│   ├── Sidebar.tsx             # Nav; links to home + agent list
│   ├── Header.tsx              # App header
│   ├── AgentsTable.tsx        # Lists agents; links to /agents/[id]/edit
│   └── AgentEditor.tsx        # Full editor: Think, Voice, Chat, Test tabs
└── lib/
    ├── agent-types.ts          # AgentConfig, ChatMessage, ChatRequest, ChatResponse
    ├── agents-store.ts         # getAgent, saveAgent, listAgents (file I/O)
    ├── elevenlabs-agent.ts     # buildElevenLabsConversationConfig, syncAgentToElevenLabs
    ├── elevenlabs-twilio-outbound.ts # startElevenLabsTwilioOutboundCall (outbound via Twilio)
    ├── zego-outbound.ts        # startZegoOutboundCall (optional Zego fallback)
    └── chat.ts                 # getAgentReply (OpenAI chat completions)

types/
└── speech.d.ts                # Web Speech API types (SpeechRecognition, etc.)

.data/
└── agents.json                # Persisted agents; keyed by agent id
```

**Config at repo root:** `tsconfig.json` (path alias `@/*` → `./src/*`), `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`.

---

## Environment variables

Create `.env.local` in the project root (do **not** commit real keys):

| Variable | Required | Purpose |
|----------|----------|--------|
| `OPENAI_API_KEY` | Yes (for Chat tab) | OpenAI API key for text chat completions |
| `ELEVENLABS_API_KEY` | Yes (for Sync + Test) | ElevenLabs API key for creating/updating agents, signed URLs, and Twilio outbound |
| `ELEVENLABS_TWILIO_PHONE_NUMBER_ID` | For Start Phone Call | ElevenLabs phone number id (from Conversational AI → Phone Numbers after linking Twilio). If set, outbound calls use ElevenLabs+Twilio. |
| `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET`, `ZEGO_OUTBOUND_CALL_API_URL` | Optional (fallback) | Zego outbound; used only if ElevenLabs+Twilio is not configured. |

---

## Setup (standalone)

```bash
npm install
cp .env.example .env.local   # if you add .env.example; else create .env.local with the two keys above
npm run dev
```

- App: `http://localhost:3000`
- Home lists agents; click one to open `/agents/[id]/edit`.

---

## API reference (for merge / reuse)

All routes are under `/api/agents/[id]`. The `[id]` is the agent id (e.g. `sleepycat_size_confirmation_en-IN_v1`); use `encodeURIComponent(id)` when calling from the client.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents/[id]` | Get agent config. 404 if not found. |
| POST | `/api/agents/[id]` | Update agent. Body: `Partial<AgentConfig>`. Returns saved agent. |
| POST | `/api/agents/[id]/chat` | Text chat. Body: `{ message, history?, contextVariables? }`. Returns `{ reply }`. Uses `OPENAI_API_KEY`. |
| POST | `/api/agents/[id]/sync-elevenlabs` | Create or update ElevenLabs agent; store `elevenlabsAgentId` if created. Uses `ELEVENLABS_API_KEY`. |
| POST | `/api/agents/[id]/unlink-elevenlabs` | Clear `elevenlabsAgentId` so next sync creates a new agent. |
| POST | `/api/agents/[id]/start-phone-call` | Start outbound phone call. Body: `{ phoneNumber, contextVariables? }`. Prefers ElevenLabs+Twilio when `ELEVENLABS_TWILIO_PHONE_NUMBER_ID` and agent synced; else Zego. |
| GET | `/api/agents/[id]/elevenlabs-signed-url` | Get signed WebSocket URL for voice test. Requires agent to be synced. |

---

## Data: agent config and storage

- **File:** `.data/agents.json`
- **Shape:** `Record<string, AgentConfig>` (keys = agent id).
- **AgentConfig** (see `src/lib/agent-types.ts`): `id`, `name`, `slug`, `provider`, `model`, `temperature`, `firstMessage`, `waitBeforeSpeaking`, `objective`, `prompt`, `selectedTools`, `libraryAccess`, `elevenlabsAgentId`, `elevenlabsVoiceId`, `callEndPrompt`, `callEndMessageType`, `callEndMessage`, `uninterruptibleReasons`, `updatedAt`, etc.

The app creates `.data` if missing and reads/writes `agents.json` via `agents-store.ts`. For a merge, you can keep file storage or replace `agents-store` with your own DB layer while keeping the same `AgentConfig` type and API contracts.

---

## Merging this project into another Next.js app

Follow these steps so the merge is clean and runnable.

### 1. Copy source tree

- Copy the entire `src/` directory into your repo (or merge file-by-file).
- Copy root config files: `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs` (merge with existing if present).
- Ensure `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` (or your equivalent).

### 2. Routes and layout

- **App Router:** This app uses the **App Router** only (`src/app/`). If your project uses Pages Router, add the App Router under `src/app/` and keep these routes.
- **Routes to add/keep:**
  - `app/page.tsx` (home)
  - `app/layout.tsx` (use or wrap with `ConditionalLayout`)
  - `app/agents/[id]/edit/page.tsx`
  - `app/api/agents/[id]/*` (all five route files above)
- If your app already has a root `layout.tsx`, either:
  - Use this project’s layout and Sidebar only for these routes (e.g. under a path prefix), or
  - Merge: wrap your existing layout’s children with `ConditionalLayout` and include this app’s `globals.css` (or merge its CSS variables into yours).

### 3. Dependencies

Add to your `package.json` (versions from this project):

```json
{
  "dependencies": {
    "@elevenlabs/react": "^0.14.1",
    "elevenlabs": "^1.59.0",
    "lucide-react": "^0.460.0",
    "next": "14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8",
    "tailwindcss": "^3.4.14",
    "typescript": "^5"
  }
}
```

Run `npm install` (or your package manager) in the target repo.

### 4. Environment

- In the target repo’s `.env.local`, add:
  - `OPENAI_API_KEY=...`
  - `ELEVENLABS_API_KEY=...`
- Do not commit keys; document in the target repo’s README.

### 5. Data directory

- Create `.data/` in the repo root (or where the app runs from) and add `agents.json` if you want initial data.
- Format: `{ "agent-id": { ...AgentConfig } }`.
- Add `.data/` to `.gitignore` if you don’t want to commit agent data.

### 6. Tailwind and CSS

- **tailwind.config.ts:** This app uses custom colors (`sidebar`, `surface`, `header`, `row`, `border`, `muted`, `pill`, `pillActive`). Merge the `theme.extend.colors` block into your config and ensure `content` includes:
  - `./src/app/**/*.{js,ts,jsx,tsx,mdx}`
  - `./src/components/**/*.{js,ts,jsx,tsx,mdx}`
- **globals.css:** Copy or merge `:root` variables and any `@tailwind` directives you need.

### 7. TypeScript

- Ensure `src/types/speech.d.ts` is included (for Web Speech API). Your `tsconfig` should include `**/*.ts` and `**/*.tsx` under `src/`.

### 8. Conflicts to watch

- **Root layout:** If both projects have a root layout, combine them (e.g. one layout that uses `ConditionalLayout` and your own chrome).
- **Home route:** If the other app already has `/`, decide whether this app’s home is at `/` or under a path (e.g. `/dashboard`). If you move it, update `Sidebar` links and any redirects.
- **API prefix:** If the other app uses a global API prefix (e.g. `/api/v1`), either mount these routes under that prefix or keep them at `/api/agents/...` and document in the target README.

### 9. After merge

- Run `npm run build` in the target repo and fix any import/path errors.
- Set both env vars and test: list agents → edit → Save Draft → Sync to ElevenLabs → Chat tab → Test tab (signed URL).

---

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — Next.js lint

---

## License

Private / use as needed for your project.
