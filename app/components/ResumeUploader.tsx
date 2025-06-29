'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

interface ResumeUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function ResumeUploader({ onFileUpload, isLoading }: ResumeUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (isLoading) return;

      if (fileRejections.length > 0) {
        // You can add more sophisticated error handling here, e.g., using a toast notification
        alert('Only .pdf files are accepted.');
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload, isLoading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center transition-colors duration-200 ease-in-out bg-gray-50 hover:border-blue-500 hover:bg-blue-50">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-6 cursor-pointer">
          <UploadCloud className={cn('h-12 w-12 text-gray-400 mb-4', { 'text-blue-500': isDragActive })} />
          {isDragActive ? (
            <p className="text-lg font-semibold text-blue-600">Drop the resume here...</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700">Drag & drop your resume here</p>
              <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
              <p className="text-xs text-gray-400 mt-4">(Only .pdf files are accepted)</p>
            </>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-full"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 animate-pulse">Analyzing resume...</p>
        </div>
      )}
    </div>
  );
}
