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
import { updateStrategyRegistry } from '@/lib/update-strategies';

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
    
    const currentGap = gapAnalysis.gaps[currentGapIndex];
    
    // Use the update strategy registry to generate the appropriate change proposal
    const proposal = updateStrategyRegistry.generateChangeProposal(
      currentGap,
      userResponse,
      resumeData
    );
    
    setProposedChange(proposal);
  }, [gapAnalysis, currentGapIndex, resumeData]);

  const handleGapResponse = useCallback((userResponse: string) => {
    generateChangeProposal(userResponse);
  }, [generateChangeProposal]);

  const acceptChange = useCallback(() => {
    if (!proposedChange) return;
    
    // Use the path from the change proposal to update the correct section
    const pathParts = proposedChange.path.split('.');
    
    // Handle array paths like 'experience[0].achievements'
    let updateObject: any = {};
    let currentObj = updateObject;
    let arrayIndex: number | null = null;
    let arrayPath: string | null = null;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      
      if (arrayMatch) {
        // Handle array path like 'experience[0]'
        const [, arrayName, indexStr] = arrayMatch;
        arrayPath = arrayName;
        arrayIndex = parseInt(indexStr, 10);
        
        if (i === pathParts.length - 1) {
          // This is the last part (shouldn't happen with our current paths)
          currentObj[arrayName] = [];
        } else {
          currentObj[arrayName] = [];
          // We'll handle the next part (field in the array item) outside the loop
          break;
        }
      } else if (i === pathParts.length - 1) {
        // Last part is the field to update
        currentObj[part] = proposedChange.newValue;
      } else {
        // Create nested object
        currentObj[part] = {};
        currentObj = currentObj[part];
      }
    }
    
    // Special handling for array paths
    if (arrayPath && arrayIndex !== null && pathParts.length > 1) {
      const lastField = pathParts[pathParts.length - 1];
      
      // Handle different types of array fields
      if (lastField === 'achievements') {
        // Handle array of strings (e.g., experience[0].achievements)
        setResumeData(prevData => {
          const newData = { ...prevData };
          
          if (!newData[arrayPath as keyof typeof newData]) {
            // Create the array if it doesn't exist
            (newData as any)[arrayPath] = [];
          }
          
          const targetArray = (newData as any)[arrayPath] as any[];
          
          // Ensure the array has enough elements
          while (targetArray.length <= arrayIndex) {
            targetArray.push({});
          }
          
          // Set the value
          if (!targetArray[arrayIndex][lastField]) {
            targetArray[arrayIndex][lastField] = [];
          }
          
          // For achievements, append new bullets without duplicates
          targetArray[arrayIndex][lastField] = [
            ...new Set([...targetArray[arrayIndex][lastField], ...(proposedChange.newValue as string[])])
          ];
          
          return newData;
        });
      } else {
        // Other array field types can be added here
      }
    } else {
      // Regular object updates
      setResumeData(prevData => deepmerge(prevData, updateObject));
    }
    
    setProposedChange(null);
    setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', content: "Great, I've updated your resume." }]);
    moveToNextGap();
  }, [proposedChange, setResumeData, moveToNextGap, setMessages]);

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
      setViewMode('chat'); // Switch to chat view to show gap analysis and interview panel
      
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
  
  // Function to complete the tailoring process and return to hub view
  const onCompleteTailoring = useCallback(() => {
    setIsTailoringMode(false);
    setViewMode('hub');
  }, []);

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
    onCompleteTailoring,
  };
}