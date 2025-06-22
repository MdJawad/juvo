'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChat, Message } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeData,
  ConversationState,
  InterviewStep,
  AreteDataResponse,
} from '@/lib/types';
import { INTERVIEW_FLOW } from '@/lib/constants';
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

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: '/api/chat',
  });

  const moveToNextStep = useCallback(() => {
    const currentStepIndex = INTERVIEW_FLOW.indexOf(currentStep);
    if (currentStepIndex < INTERVIEW_FLOW.length - 1) {
      const nextStep = INTERVIEW_FLOW[currentStepIndex + 1] as InterviewStep;
      setCurrentStep(nextStep);
      // Calculate progress based on step index
      const progressPerStep = 90 / (INTERVIEW_FLOW.length - 1); // Reserve last 10% for review
      setProgress(Math.min(10 + (currentStepIndex + 1) * progressPerStep, 100));
      
      // Notify the AI about the transition
      append({
        id: uuidv4(),
        role: 'system',
        content: `Moving to the ${nextStep} section.`,
      });
    }
  }, [currentStep, append]);

  const parseAndMergeData = (content: string) => {
    const dataRegex = /<arete-data>(.*?)<\/arete-data>/s;
    const match = content.match(dataRegex);

    if (match && match[1]) {
      try {
        const parsedData = JSON.parse(match[1]) as AreteDataResponse;
        
        // Handle step completion signal
        if (parsedData.stepComplete && parsedData.stepComplete === currentStep) {
          // Remove the stepComplete field before merging
          const { stepComplete, ...resumeUpdates } = parsedData;
          // Merge any other data updates
          if (Object.keys(resumeUpdates).length > 0) {
            setResumeData(prevData => {
              const merged = deepmerge(prevData, resumeUpdates) as Partial<ResumeData>;
              return merged;
            });
          }
          // Move to the next step
          moveToNextStep();
        } else {
          // Just merge the data updates
          setResumeData(prevData => {
            const merged = deepmerge(prevData, parsedData) as Partial<ResumeData>;
            return merged;
          });
        }
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

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Optimistically add the user's message to the UI
    const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
    append(userMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentStep: currentStep,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Add the assistant's response to the UI
      const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: data.content };
      append(assistantMessage);

      // Process the data from the response
      parseAndMergeData(data.content);

    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      append({
        id: uuidv4(),
        role: 'assistant',
        content: "Sorry, I couldn't process your response. Please try again.",
      });
    }
  };

  const filteredMessages = messages.map(m => ({
    ...m,
    content: m.content.replace(/<arete-data>.*?<\/arete-data>/s, '').trim()
  })).filter(m => m.content.length > 0);

  return {
    messages: filteredMessages,
    input,
    handleInputChange,
    handleSubmit: customHandleSubmit,
    isLoading,
    resumeData,
    currentStep,
    progress,
  };
} 