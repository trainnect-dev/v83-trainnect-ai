// Comprehensive test script for PDF upload and AI chat functionality
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const PDF_PATH = path.join(projectRoot, 'data', 'AI.pdf');
const CHAT_MODEL = 'chat-model-claude'; // or any other model available in your app

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to check if server is running
async function isServerRunning() {
  try {
    const response = await fetch(SERVER_URL);
    return response.status !== 404; // Any response other than 404 means server is running
  } catch (error) {
    return false;
  }
}

// Start the development server if it's not already running
async function startServer() {
  log('Checking if server is running...', colors.cyan);
  
  if (await isServerRunning()) {
    log('Server is already running!', colors.green);
    return;
  }
  
  log('Starting development server...', colors.yellow);
  
  const server = spawn('pnpm', ['dev'], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true,
  });
  
  server.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready in')) {
      log('Server is ready!', colors.green);
    }
  });
  
  // Wait for server to start
  let attempts = 0;
  while (!(await isServerRunning()) && attempts < 30) {
    log(`Waiting for server to start... (${attempts + 1}/30)`, colors.yellow);
    await wait(1000);
    attempts++;
  }
  
  if (attempts >= 30) {
    log('Failed to start server after 30 seconds', colors.red);
    process.exit(1);
  }
  
  log('Server is now running!', colors.green);
  return server;
}

// Upload the PDF file
async function uploadPdf() {
  log('Uploading PDF file...', colors.cyan);
  
  // Check if the file exists
  if (!fs.existsSync(PDF_PATH)) {
    log(`PDF file not found: ${PDF_PATH}`, colors.red);
    process.exit(1);
  }
  
  // Create a FormData instance
  const formData = new FormData();
  
  // Read the file and append it to the form data
  const fileBuffer = fs.readFileSync(PDF_PATH);
  formData.append('file', fileBuffer, {
    filename: 'AI.pdf',
    contentType: 'application/pdf',
  });
  
  try {
    // Send the file to the upload endpoint
    const response = await fetch(`${SERVER_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });
    
    // Parse the response
    const data = await response.json();
    
    if (response.ok) {
      log('Upload successful!', colors.green);
      log(`File URL: ${data.url}`, colors.green);
      return data;
    } else {
      log(`Upload failed: ${data.error || 'Unknown error'}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`Error during upload: ${error.message}`, colors.red);
    return null;
  }
}

// Create a chat with the uploaded PDF
async function createChat(attachment) {
  log('Creating a new chat with the PDF...', colors.cyan);
  
  try {
    // Generate a random chat ID
    const chatId = Math.random().toString(36).substring(2, 15);
    
    // Create a message with the attachment
    const messages = [
      {
        id: Math.random().toString(36).substring(2, 15),
        role: 'user',
        content: 'Can you summarize the content of this PDF file?',
        attachments: [attachment],
      },
    ];
    
    // Send the chat request
    const response = await fetch(`${SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: chatId,
        messages,
        selectedChatModel: CHAT_MODEL,
      }),
    });
    
    if (response.ok) {
      log('Chat created successfully!', colors.green);
      
      // Process the stream response
      const reader = response.body.getReader();
      let receivedText = '';
      
      log('\nAI Response:', colors.magenta);
      log('-----------------------------------', colors.magenta);
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        receivedText += chunk;
        
        // Display the chunk
        process.stdout.write(chunk);
      }
      
      log('\n-----------------------------------', colors.magenta);
      log('Response complete!', colors.green);
      
      return receivedText;
    } else {
      const errorData = await response.json();
      log(`Failed to create chat: ${errorData.error || response.statusText}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`Error during chat creation: ${error.message}`, colors.red);
    return null;
  }
}

// Main function to run the test
async function runTest() {
  log('Starting PDF upload and chat test...', colors.blue);
  
  // Start the server if needed
  const server = await startServer();
  
  // Upload the PDF
  const uploadResult = await uploadPdf();
  
  if (!uploadResult) {
    log('Test failed: Could not upload PDF', colors.red);
    if (server) server.kill();
    process.exit(1);
  }
  
  // Create a chat with the uploaded PDF
  const chatResult = await createChat({
    url: uploadResult.url,
    name: uploadResult.pathname,
    contentType: uploadResult.contentType,
  });
  
  if (!chatResult) {
    log('Test failed: Could not create chat with PDF', colors.red);
    if (server) server.kill();
    process.exit(1);
  }
  
  log('Test completed successfully!', colors.green);
  
  // Don't kill the server as it might be used for other purposes
  // If you want to kill it, uncomment the next line
  // if (server) server.kill();
}

// Run the test
runTest().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});
