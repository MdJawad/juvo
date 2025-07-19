import { MessageSquare, Bot, User, CornerDownLeft, Loader } from 'lucide-react';
import { ResumeData, ChangeProposal } from '@/lib/types';
import { ChangeEvent, FormEvent } from 'react';
import { Message } from 'ai/react';
import { ResumePreview } from './ResumePreview';
import { ChangeProposalCard } from './ChangeProposalCard';
import { GapResolution } from './ui';
import { ResumeGap } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`rounded-full p-2 bg-gray-200`}>
        {isAssistant ? <Bot className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-gray-700" />}
      </div>
      <div className={`p-3 rounded-lg max-w-[80%] ${isAssistant ? 'bg-blue-50' : 'bg-gray-100'}`}>
        <p className="text-sm text-gray-800">{message.content}</p>
      </div>
    </div>
  );
}

interface InterviewPanelProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  resumeData: Partial<ResumeData>;
  proposedChange: ChangeProposal | null;
  acceptChange: (proposal: ChangeProposal) => void;
  rejectChange: () => void;
  currentGap: ResumeGap | null;
}

export function InterviewPanel({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  resumeData, 
  proposedChange,
  acceptChange,
  rejectChange,
  currentGap,
}: InterviewPanelProps) {
  return (
    <div className="flex h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Left Panel: Chat Interface */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isLoading && <ChatMessage key="loading" message={{id: 'loading', role: 'assistant', content: '...'}} />}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {currentGap && !proposedChange ? (
            <GapResolution
              currentGap={currentGap}
              userInput={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          ) : proposedChange ? (
            <ChangeProposalCard
              proposal={proposedChange}
              onAccept={() => proposedChange && acceptChange(proposedChange)}
              onReject={rejectChange}
            />
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  type="text"
                  placeholder="Type your message..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 pr-10"
                />
                <button type="submit" disabled={isLoading || !input} className="absolute inset-y-0 right-0 flex items-center pr-3 disabled:opacity-50">
                  {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <CornerDownLeft className="h-5 w-5 text-gray-500" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel: Resume Preview */}
      <div className="w-1/2 overflow-y-auto">
        <ResumePreview
          resumeData={resumeData}
          proposedChange={proposedChange}
        />
      </div>
    </div>
  );
} 