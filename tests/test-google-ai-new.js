// Test file for Google AI integration with @google/generative-ai library
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Test the package is properly installed and can be imported
async function testGoogleAIPackage() {
  console.log('🧪 Testing Google AI Package...')
  
  try {
    // Test basic import
    console.log('✅ Google AI package imported successfully')
    
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.warn('⚠️ No API key found, testing with mock key')
      const client = new GoogleGenerativeAI('test-key')
      console.log('✅ Google AI client can be initialized')
      console.log('🎉 Package structure test completed!')
      return
    }
    
    console.log('✅ API key found:', apiKey.substring(0, 10) + '...')
    
    // Test client initialization with real API key
    const client = new GoogleGenerativeAI(apiKey)
    console.log('✅ Google AI client initialized with API key')
    
    // Test getting a model
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-001' })
    console.log('✅ Model instance created')
    
    // Test simple content generation
    console.log('🔄 Testing content generation...')
    const result = await model.generateContent('Say "Hello from Google AI!"')
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Content generation successful!')
    console.log('📝 Response:', text)
    
    // Test data filtering prompt
    console.log('\n🔄 Testing data filtering...')
    const filterPrompt = `Convert this query to JSON: "Show high priority clients"
Available fields: clientId, clientName, priority, requirements
Return: {"dataType": "clients", "conditions": [{"field": "priority", "operator": "equals", "value": 1}]}`
    
    const filterResult = await model.generateContent(filterPrompt)
    const filterResponse = await filterResult.response
    const filterText = filterResponse.text()
    
    console.log('✅ Filter generation successful!')
    console.log('📝 Filter response preview:', filterText.substring(0, 100) + '...')
    
    console.log('🎉 Google AI integration test completed successfully!')
    
  } catch (error) {
    console.error('❌ Google AI integration test failed:', error.message)
    if (error.message.includes('API_KEY')) {
      console.log('💡 Make sure your API key is valid and the Gemini API is enabled')
    }
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
      console.log('✅ Data filter service exists')
    } else {
      console.log('❌ Data filter service missing')
    }
    
    if (fs.existsSync(aiRoutePath)) {
      console.log('✅ AI API route exists')
    } else {
      console.log('❌ AI API route missing')
    }
    
    console.log('🎉 Service structure test completed!')
    
  } catch (error) {
    console.error('❌ Service structure test failed:', error.message)
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Google AI Integration Tests...\n')
  
  await testGoogleAIPackage()
  await testServiceStructure()
  
  console.log('\n🎉 All tests completed!')
  console.log('\n📝 Next steps:')
  console.log('   1. Make sure your Google AI API key is set in .env.local')
  console.log('   2. Start the development server: pnpm run dev')
  console.log('   3. Upload sample CSV data and try the AI search feature!')
}

runTests().catch(console.error)
