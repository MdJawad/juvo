'use client';

import { useState, useEffect } from 'react';
import { useChat, Message } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeData,
  ConversationState,
  InterviewStep,
} from '@/lib/types';
import { deepmerge } from 'deepmerge-ts';

// Initial state for the interview can now be a partial object
const initialResumeData: Partial<ResumeData> = {
  profile: {},
  experience: [],
  education: [],
  skills: { technical: [], soft: [] },
};

const initialState: Omit<ConversationState, 'resumeData'> & { resumeData: Partial<ResumeData> } = {
  currentStep: 'profile',
  progress: 10,
  history: [],
  resumeData: initialResumeData,
};

export function useInterview() {
  const [resumeData, setResumeData] = useState<Partial<ResumeData>>(initialState.resumeData);
  const [currentStep, setCurrentStep] = useState<InterviewStep>(initialState.currentStep);
  const [progress, setProgress] = useState<number>(initialState.progress);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      parseAndMergeData(message.content);
    },
  });

  const parseAndMergeData = (content: string) => {
    const dataRegex = /<arete-data>(.*?)<\/arete-data>/s;
    const match = content.match(dataRegex);

    if (match && match[1]) {
      try {
        const parsedData = JSON.parse(match[1]);
        setResumeData(prevData => deepmerge(prevData, parsedData));
      } catch (error) {
        console.error("Failed to parse <arete-data> JSON:", error);
      }
    }
  };

  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: "Hello! I'm Arete, your AI career counselor. To start, could you please tell me your full name?",
      }]);
    }
  }, [messages.length, isLoading, setMessages]);


  const filteredMessages = messages.map(m => ({
    ...m,
    content: m.content.replace(/<arete-data>.*?<\/arete-data>/s, '').trim()
  })).filter(m => m.content.length > 0);

  return {
    messages: filteredMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    resumeData,
    currentStep,
    progress,
  };
} 