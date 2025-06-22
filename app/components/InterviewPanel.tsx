import { MessageSquare, Bot, User, CornerDownLeft, Loader } from 'lucide-react';
import { UserProfile, Message as CustomMessage, ResumeData } from '@/lib/types';
import { ChangeEvent, FormEvent } from 'react';
import { Message } from 'ai/react';

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

interface ProfileFormProps {
  profile: Partial<UserProfile>;
}

function ProfileForm({ profile }: ProfileFormProps) {
  return (
    <div className="space-y-4 p-4 border-t border-gray-200 bg-gray-50">
      <h3 className="font-semibold text-gray-800">Your Profile Information</h3>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" id="fullName" value={profile.fullName || ''} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 bg-gray-200" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" id="email" value={profile.email || ''} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 bg-gray-200" />
      </div>
    </div>
  );
}

interface InterviewPanelProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  resumeData: Partial<ResumeData>;
}

export function InterviewPanel({ messages, input, handleInputChange, handleSubmit, isLoading, resumeData }: InterviewPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {isLoading && <ChatMessage key="loading" message={{id: 'loading', role: 'assistant', content: '...'}} />}
      </div>

      {resumeData.profile && Object.values(resumeData.profile).some(v => v) && (
        <ProfileForm profile={resumeData.profile} />
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
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
    </div>
  );
} 