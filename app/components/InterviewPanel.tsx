import { MessageSquare, Bot, User } from 'lucide-react';
import { UserProfile } from '@/lib/types';

// This is a placeholder for the real chat message component
function ChatMessage({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`rounded-full p-2 bg-gray-200`}>
        {isAssistant ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </div>
      <div className={`p-3 rounded-lg ${isAssistant ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <p className="text-sm text-gray-800">{text}</p>
      </div>
    </div>
  );
}

// This is a placeholder for the real profile form
function ProfileForm({ profile }: { profile: Partial<UserProfile> }) {
  return (
    <div className="space-y-4 p-4 border-t border-gray-200">
      <h3 className="font-semibold text-gray-800">Edit Your Profile</h3>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
        <input type="text" id="fullName" defaultValue={profile.fullName} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" id="email" defaultValue={profile.email} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2" />
      </div>
    </div>
  );
}

export function InterviewPanel() {
  // Mock data for wireframe
  const mockProfile: Partial<UserProfile> = {
    fullName: "John Doe",
    email: "john.doe@email.com"
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {/* Placeholder for conversation */}
        <ChatMessage
          role="assistant"
          text="Hello! I'm Arete, your AI career counselor. Let's start with your contact information. What is your full name?"
        />
        <ChatMessage
          role="user"
          text="Hi, I'm John Doe."
        />
        <ChatMessage
          role="assistant"
          text={`Great, John Doe. What's the best email address to reach you at? <arete-data>{"profile": {"fullName": "John Doe"}}</arete-data>`}
        />
         <ChatMessage
          role="user"
          text="john.doe@email.com"
        />
      </div>

      {/* Placeholder for smart form */}
      <ProfileForm profile={mockProfile} />

      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 pr-10"
          />
          <button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <MessageSquare className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
} 