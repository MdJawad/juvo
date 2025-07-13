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

  const { messages, append, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
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
    append(message);
  }, [gapAnalysis, currentGapIndex, append]);

  const moveToNextGap = useCallback(() => {
    if (!gapAnalysis) return;
    const nextIndex = currentGapIndex + 1;
    if (nextIndex >= gapAnalysis.gaps.length) {
      setIsGapAnalysisComplete(true);
      append({ id: uuidv4(), role: 'assistant', content: "Great! We've addressed all the identified gaps." });
    } else {
      setCurrentGapIndex(nextIndex);
    }
  }, [gapAnalysis, currentGapIndex, append]);

  useEffect(() => {
    if (isTailoringMode && gapAnalysis && !isGapAnalysisComplete) {
      presentCurrentGap();
    }
  }, [currentGapIndex, isTailoringMode, gapAnalysis, isGapAnalysisComplete, presentCurrentGap]);

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
    setResumeData(deepmerge(resumeData, { profile: { careerSummary: updatedSummary } }));
    setProposedChange(null);
    append({ id: uuidv4(), role: 'assistant', content: "Great, I've updated your resume." });
    moveToNextGap();
  }, [proposedChange, resumeData, append, moveToNextGap]);

  const rejectChange = useCallback(() => {
    setProposedChange(null);
    append({ id: uuidv4(), role: 'assistant', content: "No problem, I've discarded that suggestion." });
    moveToNextGap();
  }, [append, moveToNextGap]);

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
    append({ id: uuidv4(), role: 'user', content: `Job Description: ${jobDescription}` });
    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription }),
      });
      if (!response.ok) throw new Error('Failed to get tailoring suggestions.');
      const result: GapAnalysisResult = await response.json();
      setGapAnalysis(result);
      setIsTailoringMode(true);
      setCurrentGapIndex(0);
      setIsGapAnalysisComplete(false);
      append({ id: uuidv4(), role: 'assistant', content: `I've analyzed your resume and found ${result.gaps.length} areas for improvement.` });
    } catch (error) {
      console.error('Error tailoring resume:', error);
      append({ id: uuidv4(), role: 'assistant', content: 'Sorry, I encountered an error.' });
    } finally {
      setIsTailoring(false);
      setIsTailorModalOpen(false);
    }
  }, [resumeData, append]);

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
      append({ id: uuidv4(), role: 'assistant', content: "I've successfully parsed your resume." });
    } catch (error) {
      console.error('Failed to upload and parse resume:', error);
    } finally {
      setIsUploading(false);
    }
  }, [append]);

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