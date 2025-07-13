'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeData,
  ConversationState,
  InterviewStep,
  ChangeProposal,
  GapAnalysisResult,
  UserProfile,
  WorkExperience,
  Education,
  Skills
} from '@/lib/types';
import { INTERVIEW_FLOW } from '@/lib/constants';
import { deepmerge } from 'deepmerge-ts';

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
  const [isUploading, setIsUploading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'hub'>('chat');
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [proposedChange, setProposedChange] = useState<ChangeProposal | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [isTailoringMode, setIsTailoringMode] = useState(false);
  const [isGapAnalysisComplete, setIsGapAnalysisComplete] = useState(false);

  const parseAndMergeData = useCallback((content: string) => {
    try {
      const match = content.match(/<arete-data>([\s\S]*?)<\/arete-data>/);
      if (match && match[1]) {
        const jsonData = JSON.parse(match[1]);
        if (jsonData.changeProposal) {
          setProposedChange(jsonData.changeProposal);
        } else {
          setResumeData(prevData => deepmerge(prevData, jsonData) as Partial<ResumeData>);
        }
      }
    } catch (error) {
      console.error('Failed to parse or merge data:', error);
    }
  }, []);

  const { messages, setMessages, append, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Welcome to Arete! Upload your resume or build one from scratch to get started.',
      },
    ],
    onFinish: (message) => {
      parseAndMergeData(message.content);
    },
  });

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => !/<arete-data>/.test(msg.content));
  }, [messages]);

  const presentCurrentGap = useCallback(() => {
    if (!gapAnalysis || !gapAnalysis.gaps || currentGapIndex >= gapAnalysis.gaps.length) return;
    const gap = gapAnalysis.gaps[currentGapIndex];
    const priorityText = gap.priority === 1 ? 'High' : gap.priority === 2 ? 'Medium' : 'Low';
    const categoryText = gap.category.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const message = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: `**Gap ${currentGapIndex + 1} of ${gapAnalysis.gaps.length}** (${priorityText} Priority - ${categoryText})\n\n**${gap.title}**\n\n${gap.description}\n\nJob Requirement: ${gap.jobRequirement}\n\nCurrent Resume: ${gap.currentResumeState}\n\n${gap.suggestedQuestion}`,
    };
    // Use functional update form of setMessages to avoid dependency on 'messages'
    setMessages(prevMessages => [...prevMessages, message]);
  }, [gapAnalysis, currentGapIndex, setMessages]);

  const moveToNextGap = useCallback(() => {
    if (!gapAnalysis) return;
    const nextIndex = currentGapIndex + 1;
    if (nextIndex >= gapAnalysis.gaps.length) {
      setIsGapAnalysisComplete(true);
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: "Great! We've addressed all the identified gaps." }]);
    } else {
      setCurrentGapIndex(nextIndex);
    }
  }, [gapAnalysis, currentGapIndex, setMessages]);

  useEffect(() => {
    if (isTailoringMode && gapAnalysis && !isGapAnalysisComplete && currentGapIndex < gapAnalysis.gaps.length) {
      presentCurrentGap();
    }
  }, [isTailoringMode, gapAnalysis, isGapAnalysisComplete, currentGapIndex, presentCurrentGap]);

  const generateChangeProposal = useCallback((userResponse: string) => {
    if (!gapAnalysis || currentGapIndex === null) return;
    const gap = gapAnalysis.gaps[currentGapIndex];
    const proposal: ChangeProposal = {
      path: ``, // Simplified for now
      oldValue: gap.currentResumeState,
      newValue: userResponse,
      description: `Based on your response for '${gap.title}', I suggest this update:`
    };
    setProposedChange(proposal);
  }, [gapAnalysis, currentGapIndex]);

  const handleGapResponse = useCallback((userResponse: string) => {
    generateChangeProposal(userResponse);
  }, [generateChangeProposal]);

  const acceptChange = useCallback(() => {
    if (!proposedChange) return;
    // This is a simplified data update. A real implementation would use the 'path'.
    const updatedSummary = resumeData.profile?.careerSummary ? `${resumeData.profile.careerSummary}\n${proposedChange.newValue}` : proposedChange.newValue;
    setResumeData(prevData => deepmerge(prevData, { profile: { careerSummary: updatedSummary } }));
    setProposedChange(null);
    setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: "Great, I've updated your resume." }]);
    moveToNextGap();
  }, [proposedChange, resumeData, moveToNextGap, setMessages]);

  const rejectChange = useCallback(() => {
    setProposedChange(null);
    setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: "No problem, I've discarded that suggestion." }]);
    moveToNextGap();
  }, [moveToNextGap, setMessages]);

  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isTailoringMode && !proposedChange) {
      append({ id: uuidv4(), role: 'user', content: input });
      handleGapResponse(input);
      handleInputChange({ target: { value: '' } } as any);
    } else {
      handleSubmit(e);
    }
  };

  const handleTailorResume = useCallback(async (jobDescription: string) => {
    setIsTailoring(true);
    // Use setMessages to add multiple messages without causing re-renders from append
    setMessages(prev => [...prev, 
      { id: uuidv4(), role: 'user', content: `Job Description: ${jobDescription}` },
      { id: uuidv4(), role: 'assistant', content: 'Processing your job description... This may take up to a minute.' }
    ]);
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
    
    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Failed to get tailoring suggestions. Server responded with status ${response.status}`
        );
      }
      
      const result: GapAnalysisResult = await response.json();
      
      // Validate the response structure
      if (!result || !result.gaps || !Array.isArray(result.gaps)) {
        throw new Error('Invalid response format from the server');
      }
      
      setGapAnalysis(result);
      setIsTailoringMode(true);
      setCurrentGapIndex(0);
      setIsGapAnalysisComplete(false);
      
      // Replace the processing message with the result message
      setMessages(prev => [...prev.slice(0, -1), { 
        id: uuidv4(), 
        role: 'assistant', 
        content: `I've analyzed your resume and found ${result.gaps.length} areas for improvement.` 
      }]);
    } catch (error) {
      console.error('Error tailoring resume:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Sorry, I encountered an error while analyzing your resume.';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'The request took too long to process. Please try again with a shorter job description or try again later.';
      } else if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setMessages(prev => [...prev.slice(0, -1), { id: uuidv4(), role: 'assistant', content: errorMessage }]);
    } finally {
      clearTimeout(timeoutId);
      setIsTailoring(false);
      setIsTailorModalOpen(false);
    }
  }, [resumeData, setMessages]);

  const handleResumeUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to parse resume.');
      const result = await response.json();
      setResumeData(result.structuredData);
      setInterviewStarted(true);
      setViewMode('hub');
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: "I've successfully parsed your resume." }]);
    } catch (error) {
      console.error('Failed to upload and parse resume:', error);
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: `Error parsing resume: ${error instanceof Error ? error.message : 'Unknown error'}` }]);
    } finally {
      setIsUploading(false);
    }
  }, [setMessages]);

  return {
    messages: filteredMessages,
    input,
    handleInputChange,
    handleSubmit: customHandleSubmit,
    isLoading: isChatLoading || isUploading,
    isUploading,
    resumeData,
    currentStep: initialState.currentStep, // Simplified
    progress: initialState.progress, // Simplified
    handleResumeUpload,
    startConversation: () => setInterviewStarted(true),
    interviewStarted,
    viewMode,
    isTailorModalOpen,
    isTailoring,
    openTailorModal: () => setIsTailorModalOpen(true),
    closeTailorModal: () => setIsTailorModalOpen(false),
    handleTailorResume,
    proposedChange,
    acceptChange,
    rejectChange,
    gapAnalysis,
    currentGapIndex,
    isTailoringMode,
    isGapAnalysisComplete,
  };
}