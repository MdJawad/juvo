'use client';

import { ProgressTracker } from '@/app/components/ProgressTracker';
import { InterviewPanel } from '@/app/components/InterviewPanel';
import { ResumePreview } from '@/app/components/ResumePreview';
import { useInterview } from '@/app/hooks/useInterview';
import { Bot } from 'lucide-react';
import { ResumeUploader } from './components/ResumeUploader';

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isUploading,
    resumeData,
    currentStep,
    progress,
    handleResumeUpload,
    startConversation,
    interviewStarted,
  } = useInterview();

  // The main interview UI, shown after a path is chosen
  const interviewUI = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-150px)]">
      {/* Left Column: Progress & Interview */}
      <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-8">
        <ProgressTracker currentStep={currentStep} />
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Start over or upload a different resume</p>
          <ResumeUploader onFileUpload={handleResumeUpload} isLoading={isUploading} />
        </div>
      </div>

      {/* Center Column: Chat and Forms */}
      <div className="lg:col-span-8 xl:col-span-5">
        <InterviewPanel
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          resumeData={resumeData}
        />
      </div>

      {/* Right Column: Resume Preview */}
      <div className="hidden xl:block xl:col-span-4">
        <ResumePreview resumeData={resumeData} />
      </div>
    </div>
  );

  // The new selection screen UI, shown on first load
  const selectionScreen = (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">How would you like to start?</h2>
        <p className="text-lg text-gray-600 mb-12">Choose an option below to begin building your perfect resume with Arete, your AI-powered career counselor.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center gap-4 p-8 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow bg-white">
          <h3 className="text-2xl font-semibold text-gray-700">Upload Your Resume</h3>
          <p className="text-center text-gray-500 mb-4 h-20">Have a resume already? <br/> Upload it here to get started instantly.</p>
          <ResumeUploader onFileUpload={handleResumeUpload} isLoading={isUploading} />
        </div>
        <div className="flex flex-col items-center justify-between gap-4 p-8 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-700">Build From Scratch</h3>
            <p className="text-center text-gray-500 my-4 h-20">Don't have a resume? <br/> Let Arete guide you step-by-step through a professional interview.</p>
          </div>
          <button
            onClick={() => startConversation()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={isLoading || isUploading}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Arete AI Resume Builder
            </h1>
          </div>
        </header>

        {interviewStarted ? interviewUI : selectionScreen}

      </div>
    </main>
  );
}
