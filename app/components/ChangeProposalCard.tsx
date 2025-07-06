import { Check, X, Lightbulb } from 'lucide-react';
import { ChangeProposal } from '@/lib/types';

interface ChangeProposalCardProps {
  proposal: ChangeProposal;
  onAccept: () => void;
  onReject: () => void;
}

export function ChangeProposalCard({ proposal, onAccept, onReject }: ChangeProposalCardProps) {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 my-4 shadow-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="ml-3 flex-grow">
          <h3 className="text-sm font-semibold text-yellow-800">Arete's Suggestion</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{proposal.description}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={onReject}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <X className="h-4 w-4 mr-2" />
          Reject
        </button>
        <button
          onClick={onAccept}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Check className="h-4 w-4 mr-2" />
          Accept
        </button>
      </div>
    </div>
  );
}
