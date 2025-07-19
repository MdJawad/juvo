import React, { useState, useEffect } from 'react';
import { ResumeGap, ResumeData, ChangeProposal } from '@/lib/types';
import { ResponseForm } from './ResponseForm';
import { ResumePreview } from './ResumePreview';

interface GapDetailProps {
  gap: ResumeGap;
  gapIndex: number;
  totalGaps: number;
  resumeData: Partial<ResumeData>;
  onSkipGap: (gapId: string) => void;
  onSubmitResponse: (response: string, responseType: 'relevant' | 'similar' | 'none') => void;
  proposedChange: ChangeProposal | null;
  onAcceptChange: () => void;
  onRejectChange: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  isFirst: boolean;
  isLast: boolean;
  isGeneratingProposal?: boolean;
  proposalError?: string | null;
}

type ResponseType = 'relevant' | 'similar' | 'none' | null;

export const GapDetail: React.FC<GapDetailProps> = ({
  gap,
  gapIndex,
  totalGaps,
  resumeData,
  onSkipGap,
  onSubmitResponse,
  proposedChange,
  onAcceptChange,
  onRejectChange,
  onNavigate,
  isFirst,
  isLast,
  isGeneratingProposal = false,
  proposalError = null
}) => {
  const [selectedResponseType, setSelectedResponseType] = useState<ResponseType>(null);
  const [response, setResponse] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Show preview automatically when a new change proposal arrives
  useEffect(() => {
    setShowPreview(!!proposedChange);
  }, [proposedChange]);

  // Reset state when gap changes
  useEffect(() => {
    setSelectedResponseType(null);
    setResponse('');
    setShowPreview(false);
  }, [gap.id]); // Reset when gap.id changes
  
  const handleResponseTypeSelect = (type: ResponseType) => {
    setSelectedResponseType(type);
    setShowPreview(false);
  };
  
  const handleResponseSubmit = () => {
    if (selectedResponseType) {
      // This will be called by ResponseForm, but we'll get the actual text from there
      console.log('handleResponseSubmit called in GapDetail');
    }
  };
  
  // New function that will be passed to ResponseForm to directly receive the combined response
  const handleCombinedResponse = (combinedResponse: string) => {
    console.log('[GAP_DETAIL] Received combined response:', combinedResponse.slice(0, 120));
    if (selectedResponseType) {
      onSubmitResponse(combinedResponse, selectedResponseType);
    }
  };
  
  const priorityText = gap.priority === 1 ? 'High' : gap.priority === 2 ? 'Medium' : 'Low';
  const categoryText = gap.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className={`px-2 py-1 mr-2 text-xs rounded-full ${
              gap.priority === 1 ? 'bg-red-100 text-red-800' : 
              gap.priority === 2 ? 'bg-orange-100 text-orange-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {priorityText} Priority
            </span>
            <h2 className="text-lg font-medium text-gray-900">
              Gap {gapIndex + 1} of {totalGaps}: {gap.title}
            </h2>
          </div>
          <p className="text-sm text-gray-500">{categoryText}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onNavigate('prev')}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center"
            title="Return to gap list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button 
            onClick={() => onSkipGap(gap.id)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-medium text-gray-900">Gap Description</h3>
        <p className="mt-1 text-sm text-gray-600">
          {gap.description}
        </p>
        
        <h3 className="mt-4 text-base font-medium text-gray-900">Job Requirement</h3>
        <p className="mt-1 text-sm text-gray-600">
          {gap.jobRequirement}
        </p>
        
        <h3 className="mt-4 text-base font-medium text-gray-900">Current Resume</h3>
        <p className="mt-1 text-sm text-gray-600">
          {gap.currentResumeState}
        </p>
        
        {!showPreview && (
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900">
              {gap.suggestedQuestion}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button 
                onClick={() => handleResponseTypeSelect('relevant')}
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  selectedResponseType === 'relevant' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                I have relevant experience
              </button>
              <button 
                onClick={() => handleResponseTypeSelect('similar')}
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  selectedResponseType === 'similar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                I have similar experience
              </button>
              <button 
                onClick={() => handleResponseTypeSelect('none')}
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  selectedResponseType === 'none' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                I don't have this experience
              </button>
            </div>
          </div>
        )}
        
        {selectedResponseType && !showPreview && (
          <>
            <ResponseForm 
              responseType={selectedResponseType}
              gapCategory={gap.category}
              resumeData={resumeData}
              value={response}
              onChange={setResponse}
              onSubmit={handleResponseSubmit}
              onCombinedResponse={handleCombinedResponse}
              isLoading={isGeneratingProposal}
            />
            {isGeneratingProposal && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-blue-600 font-medium">Analyzing your response with AI...</span>
              </div>
            )}
            {proposalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                <p className="font-medium">Error generating proposal</p>
                <p className="text-sm">{proposalError}</p>
                <p className="text-sm mt-2">Please try again or contact support if the problem persists.</p>
              </div>
            )}
          </>
        )}
        
        {showPreview && proposedChange && (
          <ResumePreview
            proposedChange={proposedChange}
            onAccept={onAcceptChange}
            onReject={onRejectChange}
          />
        )}
        
        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => onNavigate('prev')}
            disabled={isFirst}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isFirst ? 'opacity-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Previous Gap
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={isLast}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLast ? 'bg-gray-300 opacity-50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next Gap
            <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
