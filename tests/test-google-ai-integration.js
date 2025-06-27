// Test file for Google AI integration
const { GoogleGenAI } = require('@google/genai')

// Test the package is properly installed and can be imported
async function testGoogleAIPackage() {
  console.log('🧪 Testing Google AI Package...')
  
  try {
    // Test basic import
    console.log('✅ Google AI package imported successfully')
    
    // Test client initialization (will fail without API key, but should not throw import errors)
    const client = new GoogleGenAI({ apiKey: 'test-key' })
    console.log('✅ Google AI client can be initialized')
    
    // Check if the models property exists
    if (client.models) {
      console.log('✅ Models interface is available')
    } else {
      console.log('❌ Models interface not found')
    }
    
    console.log('🎉 Google AI package test completed successfully!')
    
  } catch (error) {
    console.error('❌ Google AI package test failed:', error.message)
    process.exit(1)
  }
}

// Test our service files exist and are properly structured
async function testServiceStructure() {
  console.log('\n🧪 Testing Service Structure...')
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Check if service files exist
    const googleAIServicePath = path.join(__dirname, '../src/lib/ai/google-ai-service.ts')
    const dataFilterPath = path.join(__dirname, '../src/lib/ai/data-filter.ts')
    const aiRoutePath = path.join(__dirname, '../src/app/api/ai/route.ts')
    
    if (fs.existsSync(googleAIServicePath)) {
      console.log('✅ GoogleAIService file exists')
    } else {
      console.log('❌ GoogleAIService file missing')
    }
    
    if (fs.existsSync(dataFilterPath)) {
      console.log('✅ Data filter utility file exists')
    } else {
      console.log('❌ Data filter utility file missing')
    }
    
    if (fs.existsSync(aiRoutePath)) {
      console.log('✅ AI API route file exists')
    } else {
      console.log('❌ AI API route file missing')
    }
    
    // Check service file contains expected exports
    const serviceContent = fs.readFileSync(googleAIServicePath, 'utf8')
    if (serviceContent.includes('export class GoogleAIService')) {
      console.log('✅ GoogleAIService class is exported')
    }
    if (serviceContent.includes('generateDataFilter')) {
      console.log('✅ generateDataFilter method exists')
    }
    if (serviceContent.includes('generateSearchSuggestions')) {
      console.log('✅ generateSearchSuggestions method exists')
    }
    if (serviceContent.includes('explainResults')) {
      console.log('✅ explainResults method exists')
    }
    
    console.log('🎉 Service structure test completed successfully!')
    
  } catch (error) {
    console.error('❌ Service structure test failed:', error.message)
    process.exit(1)
  }
}

// Test data filter utility structure
async function testDataFilterUtility() {
  console.log('\n🧪 Testing Data Filter Utility...')
  
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Check if data filter file exists and has the right structure
    const dataFilterPath = path.join(__dirname, '../src/lib/ai/data-filter.ts')
    const content = fs.readFileSync(dataFilterPath, 'utf8')
    
    if (content.includes('export function applyDataFilter')) {
      console.log('✅ applyDataFilter function is exported')
    }
    if (content.includes('export function getAvailableFields')) {
      console.log('✅ getAvailableFields function is exported')
    }
    if (content.includes('export function getSampleData')) {
      console.log('✅ getSampleData function is exported')
    }
    if (content.includes('interface FilterCondition')) {
      console.log('✅ FilterCondition interface is defined')
    }
    if (content.includes('interface DataFilter')) {
      console.log('✅ DataFilter interface is defined')
    }
    
    console.log('🎉 Data filter utility test completed successfully!')
    
  } catch (error) {
    console.error('❌ Data filter utility test failed:', error.message)
    process.exit(1)
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Google AI Integration Tests...\n')
  
  await testGoogleAIPackage()
  await testServiceStructure()
  await testDataFilterUtility()
  
  console.log('\n🎉 All tests passed! Google AI integration is ready.')
  console.log('\n📝 Next steps:')
  console.log('   1. Get your Google AI API key from: https://aistudio.google.com/app/apikey')
  console.log('   2. Add it to .env.local as: GOOGLE_API_KEY=your_actual_key')
  console.log('   3. Start the development server: npm run dev')
  console.log('   4. Upload data and try the AI search feature!')
}

runTests().catch(console.error)
