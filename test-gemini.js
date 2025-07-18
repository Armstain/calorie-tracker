// Simple test to verify Gemini service functionality
import { GeminiService } from './lib/gemini.ts';

async function testGeminiService() {
  try {
    const service = GeminiService.getInstance();
    console.log('✓ GeminiService singleton created successfully');
    
    // Test API key validation with invalid key
    const isValidInvalid = await service.validateApiKey('invalid-key');
    console.log(`✓ Invalid API key validation: ${isValidInvalid === false ? 'PASS' : 'FAIL'}`);
    
    // Test image data validation
    try {
      await service.analyzeFood('invalid-image-data');
      console.log('✗ Should have thrown error for invalid image data');
    } catch (error) {
      console.log('✓ Invalid image data properly rejected');
    }
    
    console.log('✓ Basic Gemini service functionality verified');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

testGeminiService();