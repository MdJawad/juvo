import React, { useState, useEffect } from 'react';
import { GapAnalysisResult, ResumeData, ChangeProposal, ResumeGap } from '@/lib/types';
import { GapList } from './GapList';
import { GapDetail } from './GapDetail';
import { updateStrategyRegistry } from '@/lib/update-strategies';

interface GapAnalysisPanelProps {
  gapAnalysis: GapAnalysisResult;
  resumeData: Partial<ResumeData>;
  onChangeAccepted: (proposal: ChangeProposal) => void;
  onComplete: () => void;
}

export const GapAnalysisPanel: React.FC<GapAnalysisPanelProps> = ({
  gapAnalysis,
  resumeData,
  onChangeAccepted,
  onComplete
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [addressedGaps, setAddressedGaps] = useState<Set<string>>(new Set());
  const [skippedGaps, setSkippedGaps] = useState<Set<string>>(new Set());
  const [proposedChange, setProposedChange] = useState<ChangeProposal | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number>(gapAnalysis.summary.overallMatch || 0);
  
  const currentGap = gapAnalysis.gaps[currentGapIndex];
  const isFirstGap = currentGapIndex === 0;
  const isLastGap = currentGapIndex === gapAnalysis.gaps.length - 1;
  
  // Calculate an updated match percentage based on addressed and skipped gaps
  useEffect(() => {
    // Simple algorithm: each addressed gap increases match percentage proportionally
    const baseMatch = gapAnalysis.summary.overallMatch || 0;
    const gapCount = gapAnalysis.gaps.length;
    const addressedCount = addressedGaps.size;
    
    // Each addressed gap can improve the match by up to 30%, weighted by priority
    const improvement = gapAnalysis.gaps.reduce((acc, gap) => {
      if (addressedGaps.has(gap.id)) {
        // Weight by priority: high (1) = 3x, medium (2) = 2x, low (3) = 1x
        const priorityWeight = (4 - gap.priority); 
        return acc + (30 / gapCount) * priorityWeight;
      }
      return acc;
    }, 0);
    
    const newMatch = Math.min(100, Math.round(baseMatch + improvement));
    setMatchPercentage(newMatch);
  }, [addressedGaps, gapAnalysis]);
  
  const handleSelectGap = (index: number) => {
    setCurrentGapIndex(index);
    setProposedChange(null);
  };
  
  const handleSkipGap = (gapId: string) => {
    const newSkipped = new Set(skippedGaps);
    newSkipped.add(gapId);
    setSkippedGaps(newSkipped);
    
    // If this is the last gap, notify completion
    if (isLastGap) {
      onComplete();
    } else {
      // Otherwise move to the next gap
      setCurrentGapIndex(currentGapIndex + 1);
    }
    
    setProposedChange(null);
  };
  
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  const handleSubmitResponse = async (response: string, responseType: 'relevant' | 'similar' | 'none') => {
    console.log('handleSubmitResponse called in GapAnalysisPanel');
    console.log('Response:', response);
    console.log('Response type:', responseType);
    console.log('Current gap:', currentGap);
    
    // Reset error state
    setProposalError(null);
    
    // For "I don't have experience" responses, handle differently
    if (responseType === 'none') {
      console.log('Handling "none" response type');
      // Simply mark the gap as addressed without generating a change
      const newAddressed = new Set(addressedGaps);
      newAddressed.add(currentGap.id);
      setAddressedGaps(newAddressed);
      
      // Move to next gap or complete
      if (isLastGap) {
        console.log('Last gap, calling onComplete');
        onComplete();
      } else {
        console.log('Moving to next gap');
        setCurrentGapIndex(currentGapIndex + 1);
      }
      
      return;
    }
    
    console.log('Generating change proposal for response type:', responseType);
    // For relevant/similar experience, generate a change proposal
    setIsGeneratingProposal(true);
    try {
      const proposal = await updateStrategyRegistry.generateChangeProposal(
        currentGap,
        response,
        resumeData
      );
      console.log('Generated proposal:', proposal);
      setProposedChange(proposal);
    } catch (error) {
      console.error('Error generating change proposal:', error);
      setProposalError(error instanceof Error ? error.message : 'Failed to generate proposal');
    } finally {
      setIsGeneratingProposal(false);
    }
  };
  
  const handleAcceptChange = () => {
    if (!proposedChange) return;
    
    // Mark the gap as addressed
    const newAddressed = new Set(addressedGaps);
    newAddressed.add(currentGap.id);
    setAddressedGaps(newAddressed);
    
    // Notify parent component to apply the change
    onChangeAccepted(proposedChange);
    
    // Move to next gap or complete
    if (isLastGap) {
      onComplete();
    } else {
      setCurrentGapIndex(currentGapIndex + 1);
    }
    
    setProposedChange(null);
  };
  
  const handleRejectChange = () => {
    setProposedChange(null);
  };
  
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && !isFirstGap) {
      setCurrentGapIndex(currentGapIndex - 1);
    } else if (direction === 'next' && !isLastGap) {
      setCurrentGapIndex(currentGapIndex + 1);
    }
    setProposedChange(null);
  };
  
  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Gap Analysis</h1>
            <p className="text-sm text-gray-500">
              Address the gaps to improve your resume match for this job
            </p>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-lg font-bold">Match: {matchPercentage}%</span>
            <div className="w-32 h-4 bg-gray-200 rounded">
              <div 
                className="h-full bg-blue-600 rounded transition-all duration-500" 
                style={{ width: `${matchPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Gap Navigation */}
        <div className="lg:col-span-4">
          <GapList
            gaps={gapAnalysis.gaps}
            currentGapIndex={currentGapIndex}
            addressedGaps={addressedGaps}
            skippedGaps={skippedGaps}
            onSelectGap={handleSelectGap}
          />
        </div>

        {/* Right Panel: Selected Gap & Response */}
        <div className="lg:col-span-8">
          <GapDetail
            gap={currentGap}
            gapIndex={currentGapIndex}
            totalGaps={gapAnalysis.gaps.length}
            resumeData={resumeData}
            onSkipGap={handleSkipGap}
            onSubmitResponse={handleSubmitResponse}
            proposedChange={proposedChange}
            onAcceptChange={handleAcceptChange}
            onRejectChange={handleRejectChange}
            onNavigate={handleNavigate}
            isFirst={isFirstGap}
            isLast={isLastGap}
            isGeneratingProposal={isGeneratingProposal}
            proposalError={proposalError}
          />
          
          {/* Bottom Progress Bar */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">
                  Resume Match: {gapAnalysis.summary.overallMatch}% → {matchPercentage}%
                </span>
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500" 
                    style={{ width: `${matchPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-x-3">
                <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Save Progress
                </button>
                <button 
                  className={`px-4 py-2 border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center ${isCompleting ? 'opacity-75' : ''}`}
                  onClick={() => {
                    setIsCompleting(true);
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-lg';
                    successMessage.innerHTML = `
                      <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span><strong>Success!</strong> Your resume has been finalized.</span>
                      </div>
                    `;
                    document.body.appendChild(successMessage);
                    
                    // Remove the message after 3 seconds
                    setTimeout(() => {
                      document.body.removeChild(successMessage);
                      onComplete();
                    }, 1500);
                  }}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finalizing...
                    </>
                  ) : (
                    'Finalize Resume'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
