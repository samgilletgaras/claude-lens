export interface Block {
  type: string;
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

export interface AttachmentContent {
  type?: string;
  hookName?: string;
  hookEvent?: string;
  command?: string;
  content?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system_attachment' | 'system';
  content: string | Block[] | AttachmentContent;
  timestamp: number;
}

export interface ProjectSummary {
  id: string;
  fullPath: string;
  sessionCount: number;
  lastUpdated: number;
}

export interface Conversation {
  id: string;
  project: string;
  lastUpdated: number;
  messages: Message[];
}

export interface Skill {
  slug: string;
  name: string;
  description: string | null;
  hasSkillMd: boolean;
}

export interface SkillDetail {
  slug: string;
  name: string;
  hasSkillMd: boolean;
  frontmatter: Record<string, string>;
  body: string | null;
}

export interface LogEntry {
  project: string;
  session: string;
  lineNumber: number;
  raw: Record<string, unknown>;
}
