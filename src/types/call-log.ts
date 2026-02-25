export interface CallLogEntry {
  id: string;
  dateTime: string;
  draftName: string;
  source: string;
  status: string;
}

export interface TranscriptMessage {
  role: "agent" | "user";
  content: string;
  timestamp: string;
}

export interface CallDetails {
  agent: string;
  beginTimestamp: string;
  duration: string;
  provider: string;
  endReason: string;
}

export interface CallLogWithDetails extends CallLogEntry {
  transcript?: TranscriptMessage[];
  details?: CallDetails;
  audioUrl?: string;
}
