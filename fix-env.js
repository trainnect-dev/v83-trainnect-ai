// Script to fix the BLOB token in .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
  // Read the current .env.local file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Find and fix the BLOB token line
  const blobTokenRegex = /BLOB_READ_WRITE_TOKEN=BLOB_READ_WRITE_TOKEN=(.*)/;
  if (blobTokenRegex.test(envContent)) {
    // Fix the duplicate token issue
    envContent = envContent.replace(blobTokenRegex, 'BLOB_READ_WRITE_TOKEN=$1');
    
    // Write the fixed content back to the file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Fixed BLOB_READ_WRITE_TOKEN in .env.local');
  } else {
    console.log('No duplicate BLOB_READ_WRITE_TOKEN found in .env.local');
  }
} catch (error) {
  console.error('Error fixing .env.local:', error);
}
