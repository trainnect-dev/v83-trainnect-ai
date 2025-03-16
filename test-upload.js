// Script to test the file upload functionality
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testFileUpload() {
  try {
    // Test image upload
    console.log('Testing image upload...');
    await testUpload(
      path.join(__dirname, 'public', 'placeholder.png'), 
      'image/png'
    );
    
    // Create a simple test PDF
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.log('Creating test PDF file...');
      // This is a minimal valid PDF file
      const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
      fs.writeFileSync(testPdfPath, minimalPdf);
    }
    
    // Test PDF upload
    console.log('Testing PDF upload...');
    await testUpload(testPdfPath, 'application/pdf');
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function testUpload(filePath, contentType) {
  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);
  formData.append('file', fileStream, {
    filename: path.basename(filePath),
    contentType
  });
  
  try {
    const response = await fetch('http://localhost:3000/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // We can't set Content-Type header manually with form-data
        // It will be set automatically with the boundary
        Cookie: 'next-auth.session-token=your-session-token-here' // You'll need to replace this with a valid session token
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${contentType} upload successful:`, data);
    } else {
      console.error(`❌ ${contentType} upload failed:`, data);
    }
  } catch (error) {
    console.error(`❌ ${contentType} upload error:`, error);
  }
}

// Note: This script requires authentication to work
// You'll need to run the app, log in, and copy your session token
console.log('To use this script:');
console.log('1. Start the app with "pnpm dev"');
console.log('2. Log in to the app in your browser');
console.log('3. Copy your session cookie (next-auth.session-token) from browser DevTools');
console.log('4. Replace "your-session-token-here" in this script');
console.log('5. Install dependencies: npm install node-fetch form-data');
console.log('6. Run this script: node test-upload.js');
