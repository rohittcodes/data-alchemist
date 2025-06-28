// Test Google AI API
const { GoogleGenAI } = require('@google/genai')

async function testGoogleAI() {
  console.log('Testing Google AI API...')
  
  // Check if API key exists
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.log('No API key found. Please set GOOGLE_API_KEY environment variable.')
    return
  }
  
  console.log('API key found:', apiKey.substring(0, 10) + '...')
  
  try {
    const genAI = new GoogleGenAI({ apiKey })
    console.log('GoogleGenAI instance created successfully')
    
    // Check available methods
    console.log('Available instance properties:', Object.getOwnPropertyNames(genAI))
    console.log('Models object type:', typeof genAI.models)
    console.log('generateContent method type:', typeof genAI.models.generateContent)
    
    // Try a simple API call
    console.log('Attempting API call...')
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [{ parts: [{ text: 'Say hello in one word' }] }]
    })
    
    console.log('API call successful!')
    console.log('Result type:', typeof result)
    console.log('Result properties:', Object.getOwnPropertyNames(result))
    console.log('Response text:', result.text)
    
  } catch (error) {
    console.error('Error testing Google AI:', error.message)
    console.error('Error details:', error)
  }
}

testGoogleAI()
