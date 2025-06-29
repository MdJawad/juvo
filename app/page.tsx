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
  } = useInterview();

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-150px)]">
          {/* Left Column: Progress & Interview */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-8">
            <ProgressTracker currentStep={currentStep} />
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Or get started faster</p>
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
      </div>
    </main>
  );
}
