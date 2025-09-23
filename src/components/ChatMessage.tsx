import React from 'react';
import { UserIcon, BotIcon } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  // Format AI messages with better structure
  const formatAIMessage = (text: string) => {
    // Split by lines and process each line
    const lines = text.split('\n');
    let formattedContent: JSX.Element[] = [];
    let currentList: string[] = [];
    let codeBlock = '';
    let inCodeBlock = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          formattedContent.push(
            <div key={`code-${index}`} className="my-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border overflow-x-auto">
              <pre className="text-sm font-mono text-slate-800 dark:text-slate-200">
                <code>{codeBlock}</code>
              </pre>
            </div>
          );
          codeBlock = '';
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
          codeBlock = '';
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlock += line + '\n';
        return;
      }
      
      // Handle numbered lists (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(trimmedLine)) {
        currentList.push(trimmedLine);
        return;
      }
      
      // If we have accumulated list items, render them
      if (currentList.length > 0) {
        formattedContent.push(
          <ol key={`list-${index}`} className="my-3 ml-4 space-y-2 list-decimal list-outside">
            {currentList.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {item.replace(/^\d+\.\s/, '')}
                </span>
              </li>
            ))}
          </ol>
        );
        currentList = [];
      }
      
      // Handle bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        formattedContent.push(
          <div key={`bullet-${index}`} className="flex items-start space-x-2 my-2">
            <span className="text-primary font-bold mt-1">•</span>
            <span className="text-sm leading-relaxed font-medium">
              {trimmedLine.substring(1).trim()}
            </span>
          </div>
        );
        return;
      }
      
      // Handle headers (## ### etc.)
      if (trimmedLine.startsWith('##')) {
        const headerText = trimmedLine.replace(/^#+\s/, '');
        const level = (trimmedLine.match(/^#+/) || [''])[0].length;
        
        formattedContent.push(
          <h3 
            key={`header-${index}`} 
            className={`font-bold my-3 ${
              level === 2 ? 'text-lg text-slate-900 dark:text-slate-100' : 
              level === 3 ? 'text-base text-slate-800 dark:text-slate-200' : 
              'text-sm text-slate-700 dark:text-slate-300'
            }`}
          >
            {headerText}
          </h3>
        );
        return;
      }
      
      // Handle bold text (**text**)
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
        formattedContent.push(
          <p key={`bold-${index}`} className="text-sm leading-relaxed my-2">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
        return;
      }
      
      // Handle inline code `code`
      if (trimmedLine.includes('`')) {
        const parts = trimmedLine.split(/(`[^`]+`)/g);
        formattedContent.push(
          <p key={`inline-code-${index}`} className="text-sm leading-relaxed my-2">
            {parts.map((part, i) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={i} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-mono">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </p>
        );
        return;
      }
      
      // Regular paragraphs
      if (trimmedLine.length > 0) {
        formattedContent.push(
          <p key={`para-${index}`} className="text-sm leading-relaxed my-2 text-slate-700 dark:text-slate-300">
            {trimmedLine}
          </p>
        );
      }
    });
    
    // Handle any remaining list items
    if (currentList.length > 0) {
      formattedContent.push(
        <ol key="final-list" className="my-3 ml-4 space-y-2 list-decimal list-outside">
          {currentList.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <span className="font-medium text-blue-700 dark:text-blue-300">
                {item.replace(/^\d+\.\s/, '')}
              </span>
            </li>
          ))}
        </ol>
      );
    }
    
    return formattedContent;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-600'
        }`}>
          {isUser ? (
            <UserIcon className="h-4 w-4 text-white" />
          ) : (
            <BotIcon className="h-4 w-4 text-white" />
          )}
        </div>
        
        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message}</p>
          ) : (
            <div className="space-y-1">
              {formatAIMessage(message)}
            </div>
          )}
          
          {/* Timestamp */}
          {timestamp && (
            <div className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ChatMessage };