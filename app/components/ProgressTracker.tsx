import { CheckCircle, Circle, User, Briefcase, GraduationCap, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterviewStep } from '@/lib/types';

const steps = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'experience', name: 'Experience', icon: Briefcase },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'skills', name: 'Skills', icon: Wrench },
  { id: 'review', name: 'Review', icon: CheckCircle },
];

interface ProgressTrackerProps {
  currentStep: InterviewStep;
}

export function ProgressTracker({ currentStep }: ProgressTrackerProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resume Sections</h2>
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="flex items-center">
              <span
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  stepIdx < currentStepIndex ? 'bg-green-600' : 'bg-gray-300',
                  stepIdx === currentStepIndex && 'bg-blue-600',
                )}
              >
                {stepIdx < currentStepIndex ? (
                  <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                ) : (
                  <step.icon className="h-5 w-5 text-white" aria-hidden="true" />
                )}
              </span>
              <span className={cn('ml-3 font-medium', stepIdx <= currentStepIndex ? 'text-gray-900' : 'text-gray-500')}>
                {step.name}
              </span>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
} 