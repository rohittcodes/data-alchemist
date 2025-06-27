// Simple test for AI error correction functionality
const testAIErrorCorrection = async () => {
  console.log('Testing AI Error Correction...')
  
  // Sample validation error
  const testError = {
    type: 'error',
    category: 'required',
    severity: 'high',
    dataType: 'clients',
    row: 0,
    column: 'email',
    message: 'Email is required',
    value: null
  }
  
  const testSessionId = 'test-session-123'
  
  try {
    console.log('1. Testing suggest-fix endpoint...')
    const suggestResponse = await fetch('http://localhost:3000/api/ai/suggest-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        error: testError,
        context: {
          currentValue: null,
          fieldOptions: ['john@example.com', 'jane@example.com']
        }
      })
    })
    
    if (suggestResponse.ok) {
      const suggestion = await suggestResponse.json()
      console.log('✅ Suggest Fix Response:', suggestion)
      
      console.log('2. Testing apply-fix endpoint...')
      const applyResponse = await fetch('http://localhost:3000/api/ai/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          error: testError,
          suggestedValue: suggestion.suggestion.suggestedValue,
          applyToAll: false
        })
      })
      
      if (applyResponse.ok) {
        const result = await applyResponse.json()
        console.log('✅ Apply Fix Response:', result)
      } else {
        console.log('❌ Apply Fix Failed:', applyResponse.status)
      }
    } else {
      console.log('❌ Suggest Fix Failed:', suggestResponse.status)
    }
  } catch (error) {
    console.error('❌ Test Error:', error)
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAIErrorCorrection }
} else if (typeof window !== 'undefined') {
  window.testAIErrorCorrection = testAIErrorCorrection
}

console.log('AI Error Correction Test loaded. Run testAIErrorCorrection() to test.')
