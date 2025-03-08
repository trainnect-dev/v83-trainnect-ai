import { LanguageModelV1 } from '@ai-sdk/provider';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { mistral } from '@ai-sdk/mistral';
import { perplexity } from '@ai-sdk/perplexity';
import { openrouter } from '@openrouter/ai-sdk-provider';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Define models to test
const models: Record<string, LanguageModelV1> = {
  'chat-model-openai': openai('o3-mini'),
  'chat-model-gemini': google('gemini-2.0-flash'),
  'chat-model-claude': anthropic('claude-3-7-sonnet-20250219'),
  'chat-model-groq': groq('qwen-qwq-32b'),
  'chat-model-mistral': mistral('codestral-latest'),
  'chat-model-perplexity': perplexity('sonar'),
  'chat-model-reasoning': openrouter('google/gemini-2.0-flash-thinking-exp:free'),
};

// Test prompt
const prompt = 'Hello, how are you? Please provide a brief response.';

// Function to test a model
async function testModel(modelId: string, model: LanguageModelV1) {
  console.log(`\n=== Testing ${modelId} ===`);
  try {
    console.log(`Sending prompt: "${prompt}"`);
    const startTime = Date.now();
    
    const response = await generateText({
      model,
      prompt,
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Response (${duration.toFixed(2)}s):`);
    console.log(response);
    console.log(`=== ${modelId} test completed successfully ===`);
    return true;
  } catch (error) {
    console.error(`Error testing ${modelId}:`, error);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('Starting model tests...');
  
  const results: Record<string, boolean> = {};
  
  // Test each model
  for (const [modelId, model] of Object.entries(models)) {
    results[modelId] = await testModel(modelId, model);
  }
  
  // Print summary
  console.log('\n=== Test Summary ===');
  let allPassed = true;
  
  for (const [modelId, passed] of Object.entries(results)) {
    console.log(`${modelId}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (!passed) allPassed = false;
  }
  
  console.log(`\nOverall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

// Run the tests
runTests().catch(console.error);
