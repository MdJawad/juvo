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

---

### Implementation Plan: PDF Resume Parsing

This section outlines the step-by-step plan to implement the PDF resume parsing and ingestion feature.

**Underlying Technology:**
*   **Document Parsing:** A suitable document parsing library (e.g., `pdf-parse` on npm for server-side processing) will be used to extract raw text from the uploaded PDF.
*   **AI Data Mapping:** The Gemini model will be used via a dedicated API endpoint to convert the raw text into the structured `ResumeData` schema.

---

#### **Phase 1: Frontend - File Upload Component**

1.  **Create UI Component:**
    *   Build a new React component, `ResumeUploader.tsx`, in `app/components/`.
    *   This component will feature a drag-and-drop area and a traditional file selection button.
    *   It will accept only `.pdf` files.
    *   Display loading states (e.g., a spinner) while the file is being processed.
    *   Handle and display any potential upload errors to the user.

2.  **Integrate into Home Page:**
    *   Add the `ResumeUploader` component to `app/page.tsx`.
    *   It should be presented as an alternative starting point to the conversational interview (e.g., "Or, upload your resume to get started").

---

#### **Phase 2: Backend - File Handling API**

1.  **Create New API Route:**
    *   Create a new API route handler at `app/api/parse-resume/route.ts`.
    *   This endpoint will be responsible for receiving the uploaded PDF file.

2.  **Handle `multipart/form-data`:**
    *   The endpoint must be configured to accept `multipart/form-data`, which is standard for file uploads.
    *   It will read the file from the request body and temporarily store it for processing.

---

#### **Phase 3: Core Logic - Parsing and AI-Powered Structuring**

1.  **Integrate Parsing Library:**
    *   In the `parse-resume` API route, use the chosen document parsing library to read the PDF file buffer.
    *   Extract the raw, unstructured text content from the PDF.

2.  **Develop AI Structuring Prompt:**
    *   Engineer a new, dedicated system prompt for the Gemini model.
    *   This prompt will instruct the AI to act as a data extraction expert.
    *   The prompt will include:
        *   The raw text extracted from the resume.
        *   The target JSON schema (the `ResumeData` type definition from `lib/types.ts`).
        *   Instructions to map the unstructured text to the corresponding fields in the schema and to return *only* the valid JSON object.

3.  **Call AI Service:**
    *   The API route will send the raw text and the new prompt to the Gemini API.
    *   It will await the response, which should be the structured resume data in JSON format.
    *   Include robust error handling and validation to ensure the returned data conforms to the `ResumeData` schema.

---

#### **Phase 4: State Management & Frontend Update**

1.  **Update `useInterview` Hook:**
    *   Create a new function within the `useInterview` hook, e.g., `handleResumeUpload(file: File)`.
    *   This function will call the `/api/parse-resume` endpoint with the uploaded file.
    *   On a successful response, it will take the structured JSON data and update the `resumeData` state.

2.  **Connect UI to Hook:**
    *   The `ResumeUploader` component will call `handleResumeUpload` when a file is selected.
    *   Once the `resumeData` state is updated, the `ResumePreview` and other components will automatically re-render to show the parsed information.

---

#### **Phase 5: User Verification**

1.  **Transition the UI:**
    *   After the resume data is successfully parsed and populated, the UI should transition.
    *   The `ResumeUploader` can be hidden, and the focus should shift to the `ResumePreview` and `InterviewPanel`.

2.  **Conversational Confirmation:**
    *   Trigger a new system message in the `InterviewPanel`.
    *   The AI will initiate a conversation to verify the extracted data, e.g., "I've extracted the information from your resume. Let's quickly review it. I see your most recent role was at 'Company X'. Is that correct?"
    *   This leverages the existing conversational UI to allow the user to confirm or correct the parsed information, creating a seamless user experience.

---

### UX Improvement Plan: Enhanced Resume Upload Experience

After initial implementation and testing of the PDF parsing feature, several usability issues have been identified. The following plan outlines improvements to create a more streamlined and efficient resume upload experience.

#### **Problem Assessment:**

*   **Redundant Confirmation:** After uploading a resume, users are still required to go through each section sequentially in conversation mode.
*   **Incomplete Data Extraction:** Skills and other sections are not being fully captured from uploaded resumes.
*   **Inefficient Verification:** Users cannot easily see which information was successfully extracted vs. what needs attention.
*   **Limited Visual Feedback:** The resume preview doesn't clearly indicate which sections were successfully populated.

---

#### **Phase 1: Immediate Visual Feedback**

1.  **Enhanced Resume Preview:**
    *   Add visual indicators next to section headings (green checkmarks for complete sections, yellow warning icons for potential issues).
    *   Include a completion percentage at the top of the preview to give users a quick assessment of extraction quality.
    *   Highlight missing or incomplete fields to draw user attention to areas that need input.

2.  **Real-time Data Population:**
    *   Improve the transition from upload to preview by making it instantaneous and visually engaging.
    *   Consider adding a brief animation to show the resume being "scanned" before displaying the populated preview.

---

#### **Phase 2: Single-Screen Verification Interface**

1.  **Create a "Resume Review" Mode:**
    *   Develop a new component `ResumeReviewPanel.tsx` in `app/components/`.
    *   This panel appears immediately after successful resume parsing.
    *   Design a UI that displays all extracted information in an editable form format.

2.  **Quick Edit Functionality:**
    *   Allow users to make immediate corrections to any extracted field.
    *   Implement inline editing for efficient updates.
    *   Include a "Confirm All" button to approve the entire resume at once.
    *   Provide an option to "Edit in Conversation" for users who prefer the guided approach.

---

#### **Phase 3: Intelligent Conversation Adaptation**

1.  **Update the Conversation Flow:**
    *   Modify `useInterview.ts` to detect which sections are fully populated from the resume.
    *   Add logic to skip standard interview questions for complete sections.
    *   Implement a more natural conversational flow that acknowledges the uploaded data.
    *   Use messages like: "I've extracted your experience at CloudScale Analytics. Would you like to add any achievements that weren't in your resume?"

2.  **Context-Aware AI Prompting:**
    *   Update the AI system prompt to be aware of which information came from an uploaded resume.
    *   Engineer the prompt to focus questions only on missing or ambiguous information.
    *   Include instructions for the AI to acknowledge the source of information ("I see from your resume that...").

---

#### **Phase 4: Enhanced Skills Extraction**

1.  **Improve Skills Identification:**
    *   Enhance the `RESUME_PARSER_PROMPT` in `lib/constants.ts` to better identify skills throughout the resume.
    *   Look beyond dedicated "Skills" sections to find skills mentioned in work experience and other sections.
    *   Implement natural language processing techniques to identify action verbs and technical terms.

2.  **Skills Categorization:**
    *   Add logic to automatically categorize extracted skills as technical vs. soft skills.
    *   Create a mapping of common industry skills to aid in categorization.
    *   Implement confidence scores for skills extraction to prioritize verification questions.

---

#### **Phase 5: Resume Enhancement Guidance**

1.  **Resume Analysis:**
    *   After extraction, analyze the resume for common improvement opportunities.
    *   Check for metrics, quantifiable achievements, and action verbs.
    *   Compare against best practices for the user's industry or role.

2.  **Improvement Suggestions:**
    *   Develop a component to display targeted improvement suggestions.
    *   Offer specific enhancements (e.g., "Consider adding metrics to your CloudScale achievements").
    *   Provide options for the AI to help expand bullet points with more compelling language.
    *   Identify potential keyword gaps based on modern job requirements in the user's field.

---

#### **Implementation Priority:**

These improvements should be implemented in the following order:

1.  **Phase 3:** Intelligent Conversation Adaptation (highest impact with moderate effort)
2.  **Phase 1:** Immediate Visual Feedback (high impact with relatively low effort)
3.  **Phase 4:** Enhanced Skills Extraction (high impact but requires AI prompt engineering)
4.  **Phase 2:** Single-Screen Verification Interface (high impact but requires new UI components)
5.  **Phase 5:** Resume Enhancement Guidance (nice-to-have feature for later iterations)
