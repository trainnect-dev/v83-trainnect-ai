// Simple script to test PDF file upload functionality
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfUpload() {
  try {
    // Path to the PDF file
    const pdfFilePath = path.join(process.cwd(), 'data', 'AI.pdf');
    
    // Check if the file exists
    if (!fs.existsSync(pdfFilePath)) {
      console.error('PDF file not found:', pdfFilePath);
      return;
    }
    
    console.log('PDF file found:', pdfFilePath);
    
    // Create a FormData instance
    const formData = new FormData();
    
    // Read the file and append it to the form data
    const fileBuffer = fs.readFileSync(pdfFilePath);
    formData.append('file', fileBuffer, {
      filename: 'AI.pdf',
      contentType: 'application/pdf',
    });
    
    console.log('Uploading PDF file...');
    
    // First, we need to get a session cookie by visiting the home page
    console.log('Getting session cookie...');
    const sessionResponse = await fetch('http://localhost:3000', {
      method: 'GET',
    });
    
    if (!sessionResponse.ok) {
      console.error('Failed to get session:', sessionResponse.statusText);
      return;
    }
    
    // Extract cookies from the response
    const cookies = sessionResponse.headers.get('set-cookie');
    console.log('Session cookies obtained');
    
    // Send the file to the upload endpoint
    console.log('Sending file to upload endpoint...');
    const response = await fetch('http://localhost:3000/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Include the session cookies
        Cookie: cookies,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Read the response text first to debug
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Try to parse the JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      
      if (response.ok) {
        console.log('Upload successful!');
        console.log('Response:', data);
        console.log('File URL:', data.url);
      } else {
        console.error('Upload failed:', data.error || 'Unknown error');
      }
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError.message);
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error during upload test:', error);
  }
}

// Run the test
testPdfUpload();
