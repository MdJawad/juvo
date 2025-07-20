import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { ResumeData } from './types';

/**
 * Generates a PDF from a DOM element and downloads it
 * @param element The DOM element to convert to PDF
 * @param fileName The name of the PDF file
 * @param userData Resume data for metadata
 */
export const generatePDF = async (
  element: HTMLElement,
  fileName: string = 'resume.pdf',
  userData?: Partial<ResumeData>
): Promise<void> => {
  if (!element) {
    console.error('No element provided for PDF generation');
    return;
  }

  try {
    console.log('Starting PDF generation process...');
    
    // Use html2canvas-pro which supports oklch color functions
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for external images
      logging: false, // Disable logging for production
      backgroundColor: '#ffffff', // Ensure white background
      allowTaint: true, // Allow tainted canvas
      removeContainer: true, // Clean up automatically
    });
    
    console.log('Canvas generated successfully using html2canvas-pro');

    const imgData = canvas.toDataURL('image/png');
    
    // A4 size in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Add metadata if available
    if (userData?.profile) {
      const { fullName } = userData.profile;
      if (fullName) {
        pdf.setProperties({
          title: `Resume - ${fullName}`,
          author: fullName,
          subject: 'Professional Resume',
          creator: 'Juvo AI Resume Builder',
        });
      }
    }
    
    // Download the PDF
    pdf.save(fileName);
  } catch (error) {
    // Log detailed error information
    console.error('Error generating PDF:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific error types
      if (error.message.includes('canvas')) {
        throw new Error('Failed to render resume content to canvas. Please try again.');
      } else if (error.message.includes('tainted')) {
        throw new Error('Security issue with images. Try removing external images and try again.');
      } else if (error.message.includes('CORS')) {
        throw new Error('Cross-origin resource issue. Please try again with local resources only.');
      }
    }
    
    // Generic error message as fallback
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
