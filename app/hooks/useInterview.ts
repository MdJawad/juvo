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
  const [isUploading, setIsUploading] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    setMessages,
    append,
  } = useChat({
    api: '/api/chat',
  });

  const moveToNextStep = useCallback(() => {
    const currentStepIndex = INTERVIEW_FLOW.indexOf(currentStep);
    if (currentStepIndex < INTERVIEW_FLOW.length - 1) {
      const nextStep = INTERVIEW_FLOW[currentStepIndex + 1] as InterviewStep;
      setCurrentStep(nextStep);
      const progressPerStep = 90 / (INTERVIEW_FLOW.length - 1);
      setProgress(Math.min(10 + (currentStepIndex + 1) * progressPerStep, 100));
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
        if (parsedData.stepComplete && parsedData.stepComplete === currentStep) {
          const { stepComplete, ...resumeUpdates } = parsedData;
          if (Object.keys(resumeUpdates).length > 0) {
            setResumeData(prevData => deepmerge(prevData, resumeUpdates) as Partial<ResumeData>);
          }
          moveToNextStep();
        } else {
          setResumeData(prevData => deepmerge(prevData, parsedData) as Partial<ResumeData>);
        }
      } catch (error) {
        console.error("Failed to parse <arete-data> JSON:", error);
      }
    }
  };

  useEffect(() => {
    if (messages.length === 0 && !isChatLoading) {
      setMessages([{
        id: uuidv4(),
        role: 'assistant',
        content: "Hello! I'm Arete, your AI career counselor. To start, could you please tell me your full name?",
      }]);
    }
  }, [messages.length, isChatLoading, setMessages]);

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
    append(userMessage);
    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], currentStep }),
      });
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      const assistantMessage: Message = { id: uuidv4(), role: 'assistant', content: data.content };
      append(assistantMessage);
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

  const handleResumeUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume.');
      }

      const result = await response.json();
      const extractedText = result.rawText;

      if (!extractedText) {
        throw new Error('The parsed document appears to be empty.');
      }

      // For now, display the extracted text in the chat for verification.
      // The next step will be to send this text to an AI for structuring.
      append({
        id: uuidv4(),
        role: 'assistant', // Using 'assistant' role to make it visible
        content: `I've successfully extracted the text from your resume. Here it is:\n\n---\n\n${extractedText}`,
      });

      // The next step will be to pass this `extractedText` to the AI.
      // We are not updating the resumeData state directly anymore.

    } catch (error) {
      console.error('Failed to upload and parse resume:', error);
      // Optionally, display an error to the user via an alert or toast notification
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsUploading(false);
    }
  }, [append]);

  const filteredMessages = messages.map(m => ({
    ...m,
    content: m.content.replace(/<arete-data>.*?<\/arete-data>/s, '').trim()
  })).filter(m => m.content.length > 0 && m.role !== 'system');

  return {
    messages: filteredMessages,
    input,
    handleInputChange,
    handleSubmit: customHandleSubmit,
    isLoading: isChatLoading || isUploading,
    isUploading,
    resumeData,
    currentStep,
    progress,
    handleResumeUpload,
  };
} 