# Project Context & Product Roadmap

This document outlines the core architecture and future development roadmap for the Arete AI Resume Builder. It serves as a central source of truth for development, providing context for the AI assistant.

## Current State

The application is a Next.js project that uses a conversational AI to guide users through creating a resume from scratch.

- **Frontend:** Next.js with App Router, React, Tailwind CSS.
- **Backend:** Next.js API Routes (`/api/chat`).
- **AI:** Vercel AI SDK with Google Gemini.
- **Core Logic:** The `useInterview` hook (`app/hooks/useInterview.ts`) manages the conversational state, user input, and data extraction.
- **AI Prompting:** The primary system prompt is located in `lib/constants.ts` (`AI_SYSTEM_PROMPT`).

### Implemented: Multi-Backend AI Support

To ensure flexibility, avoid vendor lock-in, and manage API rate limits, the application has been refactored to support multiple AI backends. The system is designed to easily switch between different providers based on environment configuration.

**Supported Backends:**

- **Google Gemini:** The default cloud-based provider.
- **OpenAI-Compatible:** Any backend that adheres to the OpenAI API spec, such as a locally running Ollama instance.

## Product Development Roadmap

The application's development is guided by a clear, phased approach. The immediate goal is to establish a solid foundation with two core user workflows, which will then be extended to achieve the long-term vision of AI-powered resume tailoring.

### Core User Workflow: The "Two-Path" Approach

To provide a clearer user experience, the application will be refactored to offer two distinct starting points for the user.

1. **Path A: Upload an Existing Resume**
   - **Goal:** Allow users to quickly parse an existing resume and get an AI-generated summary and structured data.
   - **Flow:** The user uploads a PDF. The backend parses it, and the frontend displays the extracted information in a review interface. The conversational AI then helps refine and improve the content.

2. **Path B: Build a Resume from Scratch**
   - **Goal:** Guide users without a resume through a conversational interview to build a comprehensive resume from the ground up.
   - **Flow:** The user chooses this path, and the AI chatbot immediately starts the interview process, asking questions to gather information for each resume section (Profile, Experience, etc.).

### Long-Term Vision: AI-Powered Resume Tailoring

**Goal:** Enable users to tailor their generated resume for a specific job description. The AI should analyze the job description and strategically update the user's resume to highlight the most relevant skills and experiences.

**Core Problems to Solve:**
- **Job Description Input:** Create a UI for users to paste or upload a job description.
- **AI Analysis Prompt:** Engineer a new AI prompt that takes the user's current resume data and the target job description as input.
- **Strategic Content Generation:** The AI's task is not just to add keywords, but to:
    - Identify key requirements and qualifications from the job description.
    - Rephrase bullet points in the user's work experience to align with these requirements.
    - Suggest specific skills from the user's skill list to emphasize.
    - Potentially draft a new professional summary tailored to the role.
- **Presenting Diffs:** Show the suggested changes to the user in a clear, "diff-like" view, allowing them to accept or reject each modification. This maintains user control over the final document.

---

### Implementation Plan: "Two-Path" Workflow

This section outlines the step-by-step plan to refactor the application to the new "Two-Path" workflow.

#### **Phase 1: Establish the Core Workflow**

1.  **Create the Landing/Selection Page:**
    -   Refactor the main page (`app/page.tsx`) to act as a selection screen.
    -   It will present two clear options: "Upload an Existing Resume" and "Build a Resume from Scratch".
    -   State will be managed to track the user's choice.

2.  **Implement the "Build from Scratch" Path:**
    -   Create a `startConversation` function in the `useInterview` hook to programmatically begin the chatbot interview.
    -   When the user selects "Build from Scratch," this function will be called to display the initial greeting and first question.
    -   This path will lead to the existing `InterviewPanel` component, starting with a blank `resumeData` state.

3.  **Adapt the "Upload Resume" Path:**
    -   The `ResumeUploader` component will be the entry point for this path.
    -   After a successful upload and parse, the user will be taken to the `InterviewPanel` and `ResumePreview`, which will be populated with the extracted data.
    -   The conversational AI will then focus on verifying and enhancing the uploaded data, rather than starting from scratch.

#### **Phase 2: Refine and Enhance**

Once the core workflow is in place, development will focus on refining the user experience and enhancing the AI's capabilities. This includes the previously planned phases, now re-contextualized within the two paths:

- **Intelligent Conversation Adaptation:** Improve the AI's ability to recognize pre-filled data and ask more targeted questions.
- **Single-Screen Verification:** Create a more robust review interface for uploaded resumes.
- **Enhanced Skills Extraction:** Improve the accuracy of the resume parser.
- **Resume Enhancement Guidance:** Add features to help users improve the quality of their resume content.

#### **Implementation Priority & Focus**

1. **Phase 1:** Establish the Core Workflow (Top Priority)
2. **Phase 2:** Refine and Enhance (Subsequent releases)
3. ~~**Phase 3:** Implement Multi-Backend AI Support~~ (Completed)

**Development Focus:** Although the create resume from scratch functionality exists, we will not be prioritising the development of this feature unless explicitly stated, our goal will be to focus on the upload resume + refining the resume as per the job description.
