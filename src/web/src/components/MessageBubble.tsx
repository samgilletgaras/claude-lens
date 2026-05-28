import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, Block, AttachmentContent } from '../types';
import { ChevronDown, ChevronRight, BrainCircuit, Play, CheckCircle2, XCircle, Terminal, Activity, Zap, AlertTriangle } from 'lucide-react';

function formatTime(timestamp?: number) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function MarkdownBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 400 || text.split('\n').length > 10;
  
  return (
    <div className="relative group bg-zinc-800/20 border border-zinc-800/60 rounded-xl p-4 md:p-6 relative">
      <div className={`prose prose-invert prose-zinc max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-code:text-amber-200/90 text-slate-300 ${!expanded && isLong ? 'line-clamp-6 relative' : ''}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#1d1d21] to-transparent pointer-events-none" />
        )}
      </div>
      {isLong && (
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="absolute top-2 right-2 px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-semibold tracking-wider transition-colors z-10"
        >
          {expanded ? 'COLLAPSE' : 'EXPAND'}
        </button>
      )}
    </div>
  );
}

function PipelineEvent({ icon: Icon, dotColor, textColor, title, content, isCommand = false, useMarkdown = false, timestamp }: { icon: React.ElementType, dotColor: string, textColor: string, title: string, content?: string | React.ReactNode, isCommand?: boolean, useMarkdown?: boolean, timestamp?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = !!content;
  
  return (
    <div className="relative flex w-full mb-2 group items-start">
      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-800/40" />

      <div className="w-4 h-5 shrink-0 flex items-center justify-center bg-anthropic-bg relative z-20">
        <div className={`w-2 h-2 rounded-full ${dotColor} ring-2 ring-anthropic-bg opacity-80 group-hover:opacity-100 transition-opacity`} />
      </div>

      {timestamp && (
        <div className="absolute right-0 top-0 text-[10px] text-zinc-600 font-mono">
          {formatTime(timestamp)}
        </div>
      )}

      <div className="flex-1 min-w-0 pb-1 pr-16 text-left">
        <button
          onClick={() => hasContent && setExpanded(!expanded)}
          className={`w-full flex items-center h-5 text-[11px] font-medium ${textColor} focus:outline-none transition-colors ${!hasContent ? 'cursor-default' : ''}`}
        >
          {hasContent && (expanded ? <ChevronDown className="w-3 h-3 mr-1.5" /> : <ChevronRight className="w-3 h-3 mr-1.5" />)}
          {!hasContent && <span className="w-4.5" />}
          <Icon className="w-3 h-3 mr-1.5" />
          <span className={`${isCommand ? 'font-mono' : ''}`}>{title}</span>
        </button>
        
        {expanded && hasContent && (
          <div className="pl-6 pb-2 pt-1 relative">
             <div className="absolute left-1.5 top-0 bottom-0 w-px bg-zinc-800/40" />
             {useMarkdown && typeof content === 'string' ? (
                <div className="text-[12px] bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/60 shadow-inner">
                  <div className="prose prose-invert prose-zinc max-w-none prose-sm prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-p:leading-snug prose-li:leading-snug text-zinc-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                </div>
             ) : (
                <div className="text-[10px] text-zinc-400 max-h-64 overflow-y-auto font-mono whitespace-pre-wrap bg-zinc-950/80 p-3 rounded-md border border-zinc-800/80 shadow-inner">
                  {content}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

function AvatarBlock({ isUser, node, timestamp }: { isUser: boolean, node: React.ReactNode, timestamp?: number }) {
  const textColor = isUser ? 'text-amber-500/70' : 'text-emerald-500/70';
  const bgColor = isUser ? 'bg-amber-500' : 'bg-emerald-500';
  const label = isUser ? 'User' : 'Claude';

  return (
    <div className="relative flex w-full mb-2 group pt-2 pb-6 items-start">
      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-800/40" />

      <div className="w-4 shrink-0 flex items-center justify-center mt-[3px] bg-anthropic-bg relative z-20">
        <div className={`w-2 h-2 rounded-full ring-2 ring-anthropic-bg ${bgColor}`} />
      </div>

      {timestamp && (
        <div className="absolute right-0 top-[8px] text-[10px] text-zinc-600 font-mono">
          {formatTime(timestamp)}
        </div>
      )}

      <div className="flex-1 min-w-0">
         <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center ${textColor}`}>
           {label}
         </div>
         <div className="ml-1 md:ml-0">
           {node}
         </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'system_attachment') {
    const att = message.content as AttachmentContent;
    const title = att.hookEvent ? `Hook: ${att.hookEvent} (${att.type})` : (att.command || 'System Attachment');
    const isError = att.exitCode !== undefined && att.exitCode !== 0;
    const dotColor = isError ? 'bg-red-500' : 'bg-blue-500';
    const textColor = isError ? 'text-red-400/80 hover:text-red-300' : 'text-blue-400/80 hover:text-blue-300';
    
    return <PipelineEvent timestamp={message.timestamp} icon={Activity} dotColor={dotColor} textColor={textColor} title={title} content={att.stdout || att.content || JSON.stringify(att, null, 2)} />;
  }

  if (message.role === 'system') {
    return <PipelineEvent timestamp={message.timestamp} icon={Zap} dotColor="bg-zinc-500" textColor="text-zinc-400/80 hover:text-zinc-300" title="System Event" content={typeof message.content === 'string' ? message.content : JSON.stringify(message.content)} />;
  }

  const isUser = message.role === 'user';
  const contentArray: Block[] = Array.isArray(message.content)
    ? message.content
    : typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }]
      : [{ type: 'text', text: JSON.stringify(message.content) }];

  return (
    <div className="w-full relative">
      {contentArray.map((block, i) => {
        if (block.type === 'text') {
           const originalText = block.text || '';
           let text = originalText;
           
           let caveatStr = null;
           const caveatRegex = /<local-command-caveat>([\s\S]*?)<\/local-command-caveat>/g;
           const caveatMatch = text.match(caveatRegex);
           if (caveatMatch) {
             caveatStr = caveatMatch.map((c: string) => c.replace(/<\/?local-command-caveat>/g, '').trim()).join('\n');
             text = text.replace(caveatRegex, '').trim();
           }

           let commandMsgStr = null;
           const cmdMsgRegex = /<command-message>([\s\S]*?)<\/command-message>/g;
           const cmdMsgMatch = text.match(cmdMsgRegex);
           if (cmdMsgMatch) {
             commandMsgStr = cmdMsgMatch.map((c: string) => c.replace(/<\/?command-message>/g, '').trim()).join(', ');
             text = text.replace(cmdMsgRegex, '').trim();
           }

           text = text.replace(/<command-args>([\s\S]*?)<\/command-args>/g, '').trim();

           const cmdMatch = text.match(/<command-name>(.*?)<\/command-name>/);
           let localCommandName = null;
           if (cmdMatch) {
             localCommandName = cmdMatch[1];
             text = text.replace(/<command-name>.*?<\/command-name>/, '').trim();
           }

           if (commandMsgStr && !localCommandName) {
             localCommandName = commandMsgStr;
           }

           return (
             <div key={i} className="flex flex-col w-full">
               {caveatStr && (
                 <PipelineEvent timestamp={message.timestamp} icon={AlertTriangle} dotColor="bg-amber-600" textColor="text-amber-500/80 hover:text-amber-400" title="Local Command Override" isCommand={false} content={caveatStr} />
               )}
               {localCommandName && (
                 <PipelineEvent timestamp={message.timestamp} icon={Terminal} dotColor="bg-amber-500" textColor="text-amber-500/80 hover:text-amber-400" title={`Local Command: ${localCommandName}`} isCommand={true} content={""} />
               )}
               {text && (
                 <AvatarBlock timestamp={message.timestamp} isUser={isUser} node={<MarkdownBlock text={text} />} />
               )}
             </div>
           );
        }
        
        if (block.type === 'thinking') {
           // Do not use Markdown for thinking blocks because Claude injects broken XML tags and Markdown 
           // elements within its thoughts that cause ReactMarkdown to silently fail or swallow the entire block,
           // resulting in an empty container. Plain text pre-wrap guarantees visibility.
           return <PipelineEvent timestamp={message.timestamp} key={i} icon={BrainCircuit} dotColor="bg-indigo-500" textColor="text-indigo-400/80 hover:text-indigo-300" title="Thought Process" content={block.thinking} useMarkdown={false} />
        }
        
        if (block.type === 'tool_use') {
           const inputStr = typeof block.input === 'string' ? block.input : JSON.stringify(block.input, null, 2);
           return <PipelineEvent timestamp={message.timestamp} key={i} icon={Play} dotColor="bg-blue-500" textColor="text-blue-400/80 hover:text-blue-300" title={`Tool Use: ${block.name}`} isCommand={true} content={inputStr} />;
        }
        
        if (block.type === 'tool_result') {
           const isError = block.is_error || (typeof block.content === 'string' && block.content.toLowerCase().includes('error'));
           const dotColor = isError ? 'bg-red-500' : 'bg-emerald-500';
           const textColor = isError ? 'text-red-400/80 hover:text-red-300' : 'text-emerald-400/80 hover:text-emerald-300';
           const Icon = isError ? XCircle : CheckCircle2;
           
           const resText = typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2);
           
           return <PipelineEvent timestamp={message.timestamp} key={i} icon={Icon} dotColor={dotColor} textColor={textColor} title={`Tool Result`} content={resText} />;
        }

        return null;
      })}
    </div>
  );
}
