'use client';

import { useState } from 'react';
import { ProgressTracker } from '@/app/components/ProgressTracker';
import { InterviewPanel } from '@/app/components/InterviewPanel';
import { ResumePreview } from '@/app/components/ResumePreview';
import { InterviewStep } from '@/lib/types';
import { Bot } from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<InterviewStep>('profile');

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
          </div>

          {/* Center Column: Chat and Forms */}
          <div className="lg:col-span-8 xl:col-span-5">
            <InterviewPanel />
          </div>

          {/* Right Column: Resume Preview */}
          <div className="hidden xl:block xl:col-span-4">
            <ResumePreview />
          </div>
        </div>
      </div>
    </main>
  );
}
