import { Phone, Mail, Linkedin, Github, Globe } from 'lucide-react';
import { ResumeData } from '@/lib/types';

interface ResumePreviewProps {
  resumeData: Partial<ResumeData>;
}

export function ResumePreview({ resumeData }: ResumePreviewProps) {
  const { profile = {}, experience = [], education = [], skills = { technical: [], soft: [] } } = resumeData;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg h-full overflow-y-auto">
      <div className="p-8 text-sm text-gray-800 font-sans">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">{profile.fullName || 'Your Name'}</h1>
          <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-gray-600">
            <span className="flex items-center"><Mail className="mr-1.5 h-3 w-3" />{profile.email || 'your.email@example.com'}</span>
            <span className="flex items-center"><Phone className="mr-1.5 h-3 w-3" />{profile.phone || '123-456-7890'}</span>
          </div>
          <div className="flex justify-center items-center space-x-4 mt-1 text-xs text-blue-600">
            {profile.linkedin && <a href="#" className="flex items-center"><Linkedin className="mr-1.5 h-3 w-3" />{profile.linkedin}</a>}
            {profile.github && <a href="#" className="flex items-center"><Github className="mr-1.5 h-3 w-3" />{profile.github}</a>}
            {profile.portfolio && <a href="#" className="flex items-center"><Globe className="mr-1.5 h-3 w-3" />{profile.portfolio}</a>}
          </div>
        </div>

        {/* Summary */}
        {profile.careerSummary && (
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700">Career Summary</h2>
            <div className="h-0.5 bg-gray-200 my-1"></div>
            <p className="mt-2 text-sm">{profile.careerSummary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700">Experience</h2>
            <div className="h-0.5 bg-gray-200 my-1"></div>
            {experience.map((job) => (
              <div key={job.id} className="mt-3">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-md">{job.position}</h3>
                  <p className="text-xs font-medium text-gray-600">{job.startDate} - {job.endDate}</p>
                </div>
                <h4 className="font-medium text-sm text-blue-700">{job.company}</h4>
                <ul className="list-disc list-outside ml-5 mt-1 space-y-1 text-sm">
                  {job.achievements.map((ach, index) => <li key={index}>{ach}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
} 