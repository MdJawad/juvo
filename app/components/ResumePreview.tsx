import { Phone, Mail, Linkedin, Github, Globe } from 'lucide-react';
import { ResumeData } from '@/lib/types';

// Mock data for the wireframe preview
const mockResumeData: ResumeData = {
  profile: {
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '123-456-7890',
    linkedin: 'linkedin.com/in/johndoe',
    github: 'github.com/johndoe',
    portfolio: 'johndoe.dev',
    careerSummary:
      'Innovative and results-driven Senior Software Engineer with over 8 years of experience in developing and scaling web applications. Proven ability to lead projects, mentor junior developers, and collaborate with cross-functional teams to deliver high-quality software solutions.',
  },
  experience: [
    {
      id: 'exp1',
      company: 'Innovatech Solutions',
      position: 'Senior Software Engineer',
      startDate: 'Jan 2020',
      endDate: 'Present',
      achievements: [
        'Led the development of a new microservices architecture, improving system scalability by 40%.',
        'Reduced API response times by 200ms by implementing advanced caching strategies.',
        'Mentored a team of 4 junior engineers, fostering a culture of code quality and continuous learning.',
      ],
    },
  ],
  education: [
    {
      id: 'edu1',
      institution: 'State University',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      startDate: 'Aug 2016',
      endDate: 'May 2018',
    },
  ],
  skills: {
    technical: ['TypeScript', 'React', 'Node.js', 'GraphQL', 'AWS', 'Docker'],
    soft: ['Team Leadership', 'Agile Methodologies', 'Problem Solving', 'Communication'],
  },
};

export function ResumePreview() {
  const resume = mockResumeData;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg h-full overflow-y-auto">
      <div className="p-8 text-sm text-gray-800 font-sans">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">{resume.profile.fullName}</h1>
          <div className="flex justify-center items-center space-x-4 mt-2 text-xs text-gray-600">
            <span className="flex items-center"><Mail className="mr-1.5 h-3 w-3" />{resume.profile.email}</span>
            <span className="flex items-center"><Phone className="mr-1.5 h-3 w-3" />{resume.profile.phone}</span>
          </div>
          <div className="flex justify-center items-center space-x-4 mt-1 text-xs text-blue-600">
            <a href="#" className="flex items-center"><Linkedin className="mr-1.5 h-3 w-3" />{resume.profile.linkedin}</a>
            <a href="#" className="flex items-center"><Github className="mr-1.5 h-3 w-3" />{resume.profile.github}</a>
            <a href="#" className="flex items-center"><Globe className="mr-1.5 h-3 w-3" />{resume.profile.portfolio}</a>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700">Career Summary</h2>
          <div className="h-0.5 bg-gray-200 my-1"></div>
          <p className="mt-2 text-sm">{resume.profile.careerSummary}</p>
        </div>

        {/* Experience */}
        <div className="mt-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-700">Experience</h2>
          <div className="h-0.5 bg-gray-200 my-1"></div>
          {resume.experience.map((job) => (
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

      </div>
    </div>
  );
} 