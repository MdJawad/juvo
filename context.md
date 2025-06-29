# Project Context & Product Roadmap

This document outlines the core architecture and future development roadmap for the Arete AI Resume Builder. It serves as a central source of truth for development, providing context for the AI assistant.

## Current State

The application is a Next.js project that uses a conversational AI to guide users through creating a resume from scratch.

-   **Frontend:** Next.js with App Router, React, Tailwind CSS.
-   **Backend:** Next.js API Routes (`/api/chat`).
-   **AI:** Vercel AI SDK with Google Gemini.
-   **Core Logic:** The `useInterview` hook (`app/hooks/useInterview.ts`) manages the conversational state, user input, and data extraction.
-   **AI Prompting:** The primary system prompt is located in `lib/constants.ts` (`AI_SYSTEM_PROMPT`).

## Product Development Roadmap

The following are the next two major features planned for development.

### 1. PDF Resume Parsing and Ingestion

**Goal:** Allow users to upload an existing resume in PDF format, automatically parse it, and populate the application's data schema with the extracted information.

**Core Problems to Solve:**
-   **File Upload:** Implement a secure and user-friendly file upload component on the frontend.
-   **PDF Parsing:** Integrate a library or service to accurately extract text and structure from PDF documents. This needs to be robust enough to handle various resume templates and formats.
-   **Data Mapping:** Develop a sophisticated mapping layer, likely using an LLM, to intelligently map the unstructured text from the resume to the application's structured schema (`ResumeData` type in `lib/types.ts`). This includes identifying sections like `profile`, `experience`, `education`, and `skills`.
-   **User Verification:** After parsing, present the extracted information to the user for review and confirmation before saving. The conversational AI can be used to clarify any ambiguities (e.g., "I see you were a 'Software Engineer' at Acme Corp. Is that correct?").

### 2. AI-Powered Resume Tailoring

**Goal:** Enable users to tailor their generated resume for a specific job description. The AI should analyze the job description and strategically update the user's resume to highlight the most relevant skills and experiences.

**Core Problems to Solve:**
-   **Job Description Input:** Create a UI for users to paste or upload a job description.
-   **AI Analysis Prompt:** Engineer a new AI prompt that takes the user's current resume data and the target job description as input.
-   **Strategic Content Generation:** The AI's task is not just to add keywords, but to:
    -   Identify key requirements and qualifications from the job description.
    -   Rephrase bullet points in the user's work experience to align with these requirements.
    -   Suggest specific skills from the user's skill list to emphasize.
    -   Potentially draft a new professional summary tailored to the role.
-   **Presenting Diffs:** Show the suggested changes to the user in a clear, "diff-like" view, allowing them to accept or reject each modification. This maintains user control over the final document.
