'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChat, Message } from 'ai/react';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeData,
  ConversationState,
  InterviewStep,
  AreteDataResponse,
  UserProfile,
  WorkExperience,
  Education,
  Skills,
} from '@/lib/types';
import { INTERVIEW_FLOW } from '@/lib/constants';
import { deepmerge } from 'deepmerge-ts';

// Helper functions to determine if a resume section is considered complete
const isProfileComplete = (profile?: Partial<UserProfile>): boolean => {
  if (!profile) return false;
  // Consider profile complete if it has name and at least 2 other fields
  const requiredFields = ['fullName', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'careerSummary'];
  const completedFields = requiredFields.filter(field => {
    const value = profile[field as keyof UserProfile];
    return value !== undefined && value !== null && value !== '';
  });
  return Boolean(profile.fullName) && completedFields.length >= 3;
};

const isExperienceComplete = (experience?: Partial<WorkExperience>[]): boolean => {
  if (!experience || experience.length === 0) return false;
  // Consider experience complete if it has at least one job with company, position, dates
  return experience.some(job => {
    const hasAchievements = job.achievements && 
                          Array.isArray(job.achievements) && 
                          job.achievements.length > 0;
    return Boolean(job.company) && Boolean(job.position) && Boolean(job.startDate) && hasAchievements;
  });
};

const isEducationComplete = (education?: Partial<Education>[]): boolean => {
  if (!education || education.length === 0) return false;
  // Consider education complete if it has at least one entry with institution, degree, dates
  return education.some(edu => (
    Boolean(edu.institution) && Boolean(edu.degree) && Boolean(edu.fieldOfStudy) && Boolean(edu.startDate)
  ));
};

const isSkillsComplete = (skills?: Partial<Skills>): boolean => {
  if (!skills) return false;
  // Consider skills complete if it has at least 3 technical skills
  return (
    skills.technical && 
    Array.isArray(skills.technical) && 
    skills.technical.length >= 3
  );
};

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

// Interface to track which sections were populated from a resume upload
interface PopulatedSections {
  profile: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
  [key: string]: boolean; // Allow indexing with string for other steps like 'review' and 'done'
}

export function useInterview() {
  const [resumeData, setResumeData] = useState<Partial<ResumeData>>(initialState.resumeData);
  const [currentStep, setCurrentStep] = useState<InterviewStep>(initialState.currentStep);
  const [progress, setProgress] = useState<number>(initialState.progress);
  const [isUploading, setIsUploading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  
  // New state to track which sections were populated from resume upload
  const [populatedFromResume, setPopulatedFromResume] = useState<PopulatedSections>({
    profile: false,
    experience: false,
    education: false,
    skills: false,
    review: false,
    done: false
  });
  
  // Calculate which sections are complete based on current resume data
  const completeSections = useMemo(() => ({
    profile: isProfileComplete(resumeData.profile),
    experience: isExperienceComplete(resumeData.experience),
    education: isEducationComplete(resumeData.education),
    skills: isSkillsComplete(resumeData.skills),
    review: false, // Review section is never skipped
    done: false    // Done state is never skipped
  }), [resumeData]);

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

  // Helper function to find next incomplete section that needs attention
  const findNextIncompleteStep = useCallback((startStep: InterviewStep): InterviewStep => {
    const startIndex = INTERVIEW_FLOW.indexOf(startStep);
    if (startIndex === -1 || startIndex >= INTERVIEW_FLOW.length - 1) {
      return 'review'; // Default to review if we're at the end or can't find the step
    }
    
    // Start from the next step after the current one
    for (let i = startIndex + 1; i < INTERVIEW_FLOW.length; i++) {
      const step = INTERVIEW_FLOW[i] as InterviewStep;
      // Always proceed to review step, or if the section is not complete yet
      if (step === 'review' || step === 'done' || !completeSections[step]) {
        return step;
      }
    }
    
    return 'review'; // Default to review if all sections are complete
  }, [completeSections]);

  // Updated moveToNextStep function to skip completed sections
  const moveToNextStep = useCallback(() => {
    const currentStepIndex = INTERVIEW_FLOW.indexOf(currentStep);
    if (currentStepIndex < INTERVIEW_FLOW.length - 1) {
      // Find the next step that needs attention (incomplete)
      const nextStep = findNextIncompleteStep(currentStep);
      const nextStepIndex = INTERVIEW_FLOW.indexOf(nextStep);
      
      setCurrentStep(nextStep);
      
      // Update progress based on how many steps we've moved through
      const progressPerStep = 90 / (INTERVIEW_FLOW.length - 1);
      const progressValue = Math.min(10 + nextStepIndex * progressPerStep, 100);
      setProgress(progressValue);
      
      // Customize message based on whether we're skipping sections
      if (nextStepIndex > currentStepIndex + 1) {
        // We're skipping one or more sections
        const skippedSections = INTERVIEW_FLOW.slice(currentStepIndex + 1, nextStepIndex)
          .filter(step => step !== 'review' && step !== 'done');
        
        if (skippedSections.length > 0) {
          append({
            id: uuidv4(),
            role: 'system',
            content: `Skipping ${skippedSections.join(', ')} sections since they are already complete from your resume. Moving to the ${nextStep} section.`,
          });
        } else {
          append({
            id: uuidv4(),
            role: 'system',
            content: `Moving to the ${nextStep} section.`,
          });
        }
      } else {
        append({
          id: uuidv4(),
          role: 'system',
          content: `Moving to the ${nextStep} section.`,
        });
      }
    }
  }, [currentStep, append, completeSections, findNextIncompleteStep]);

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

      // Check if we have structured data from the API
      if (result.structuredData) {
        // Update the resume data with the structured information
        setResumeData(prevData => deepmerge(prevData, result.structuredData) as Partial<ResumeData>);
        setInterviewStarted(true);

        // Use a timeout to allow the state to update before sending messages
        setTimeout(() => {
          const newlyPopulatedSections: PopulatedSections = {
            profile: isProfileComplete(result.structuredData.profile) && !completeSections.profile,
            experience: isExperienceComplete(result.structuredData.experience) && !completeSections.experience,
            education: isEducationComplete(result.structuredData.education) && !completeSections.education,
            skills: isSkillsComplete(result.structuredData.skills) && !completeSections.skills,
            review: false,
            done: false
          };
          setPopulatedFromResume(newlyPopulatedSections);

          const foundSections = Object.entries(newlyPopulatedSections)
            .filter(([key, value]) => value && key !== 'review' && key !== 'done')
            .map(([key]) => key);

          let responseMessage = `I've successfully parsed your resume and extracted your information.`;
          if (foundSections.length > 0) {
            responseMessage += ` I found information for the following sections: ${foundSections.join(', ')}.`;
          }

          append({
            id: uuidv4(),
            role: 'assistant',
            content: responseMessage,
          });

          if (currentStep !== 'review' && newlyPopulatedSections[currentStep]) {
            const nextIncompleteStep = findNextIncompleteStep(currentStep);
            append({
              id: uuidv4(),
              role: 'assistant',
              content: `I see that your ${currentStep} section is already complete from your resume. Let's focus on the ${nextIncompleteStep} section instead.`,
            });
            setCurrentStep(nextIncompleteStep);
          } else {
            append({
              id: uuidv4(),
              role: 'assistant',
              content: `Would you like to make any changes to the information extracted from your resume?`,
            });
          }
        }, 100);
      } else {
        // If structured data is not available, inform the user
        const errorMessage = result.error || 'Unknown error';
        const errorDetails = result.errorDetails || '';

        console.error('Resume parsing failed:', errorMessage, errorDetails);

        append({
          id: uuidv4(),
          role: 'assistant',
          content: `I was unable to parse your resume automatically. This could be due to an unusual format or a problem with our parsing service. Please try uploading a different file or build your resume manually.`,
        });
      }

    } catch (error) {
      console.error('Failed to upload and parse resume:', error);
      // Optionally, display an error to the user via an alert or toast notification
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsUploading(false);
    }
  }, [append]);

  const startConversation = useCallback(() => {
    // Only start if there are no messages yet
    if (messages.length === 0) {
      append({
        id: uuidv4(),
        role: 'assistant',
        content:
          "Hello! I'm Arete, your expert career counselor. I'm here to guide you in building an exceptional resume. Let's start with your basic information. What is your full name?",
      });
      setInterviewStarted(true);
    }
  }, [append, messages]);

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
    startConversation,
    interviewStarted,
  };
} 