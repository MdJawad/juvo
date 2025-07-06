// Phase 2: Core Types & Interfaces

/**
 * Represents a single message in the chat conversation.
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date; // Made optional since we don't always need it
}

/**
 * Defines the user's personal and contact information.
 */
export interface UserProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  careerSummary?: string;
}

/**
 * Represents a single work experience entry.
 */
export interface WorkExperience {
  id?: string; // Made optional since the AI might not generate IDs
  company: string;
  position: string;
  startDate: string;
  endDate?: string; // Made optional for current positions
  achievements: string[];
  location?: string;
}

/**
 * Represents a single education entry.
 */
export interface Education {
  id?: string; // Made optional since the AI might not generate IDs
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: number;
}

/**
 * Defines the user's technical and soft skills.
 */
export interface Skills {
  technical: string[];
  soft: string[];
}

/**
 * The complete data structure for the generated resume.
 */
export interface ResumeData {
  profile: UserProfile;
  experience: WorkExperience[];
  education: Education[];
  skills: Skills;
}

/**
 * Represents the current state of the AI-driven conversation.
 */
export type InterviewStep = 'profile' | 'experience' | 'education' | 'skills' | 'review' | 'done';

export interface ConversationState {
  currentStep: InterviewStep;
  progress: number; // Percentage (0-100)
  history: Message[];
  resumeData: Partial<ResumeData>;
}

/**
 * Represents the structured data that the AI can return in its <arete-data> blocks.
 * This includes both resume data and control signals like stepComplete.
 */
/**
 * Represents a proposed change to a field in the resume data, allowing the UI to highlight it.
 */
export interface ChangeProposal {
  path: string; // e.g., "experience[0].achievements[1]"
  oldValue: any;
  newValue: any;
  description: string;
}

export interface AreteDataResponse {
  // Control signals
  stepComplete?: InterviewStep;

  // A specific change proposal to be reviewed by the user
  changeProposal?: ChangeProposal;
  
  // Resume data (all optional since the AI might send partial updates)
  profile?: Partial<UserProfile>;
  experience?: Partial<WorkExperience>[];
  education?: Partial<Education>[];
  skills?: Partial<Skills>;
} 