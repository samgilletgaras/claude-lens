import type { ConversationSummary, Message, AttachmentContent } from './types';
import { formatDuration } from './utils';

export function extractMessageText(msg: Message): string {
  if (msg.role === 'tool_use') return `${msg.name ?? ''}: ${JSON.stringify(msg.input ?? {})}`;
  if (msg.role === 'system_attachment') {
    const att = msg.content as AttachmentContent;
    return [att?.command, att?.stdout, att?.content, att?.stderr].filter(Boolean).join(' ');
  }
  return typeof msg.content === 'string' ? msg.content : '';
}

export function getSessionDuration(conv: ConversationSummary): string | null {
  if (!conv.firstMessageTs || !conv.lastUpdated || conv.lastUpdated <= conv.firstMessageTs) return null;
  return formatDuration(conv.lastUpdated - conv.firstMessageTs);
}

export function exportSession(conv: ConversationSummary, messages: Message[], assistantLabel = 'Claude') {
  const lines: string[] = [`# Session\n\n*${new Date(conv.lastUpdated).toLocaleString()}*\n\n---\n`];
  [...messages].reverse().forEach(msg => {
    if (msg.role === 'user') {
      lines.push('\n\n**User**\n\n');
      if (typeof msg.content === 'string') lines.push(msg.content);
    } else if (msg.role === 'assistant') {
      lines.push(`\n\n**${assistantLabel}**\n\n`);
      if (typeof msg.content === 'string') lines.push(msg.content);
    } else if (msg.role === 'tool_use') {
      lines.push(`\n*Tool: ${msg.name ?? ''}*\n`);
    }
  });
  const blob = new Blob([lines.join('')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${conv.id.slice(0, 8)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
