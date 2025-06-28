// Test JSON parsing fix for Google AI service
const testJsonParsing = () => {
  console.log('🧪 Testing JSON Parsing Fix...\n')
  
  // Simulate problematic AI responses
  const testResponses = [
    {
      name: 'Code block with backticks',
      response: '```json\n["query1", "query2", "query3"]\n```',
      expected: ['query1', 'query2', 'query3']
    },
    {
      name: 'Code block without newlines',
      response: '```json["query1", "query2"]```',
      expected: ['query1', 'query2']
    },
    {
      name: 'Plain JSON array',
      response: '["query1", "query2", "query3"]',
      expected: ['query1', 'query2', 'query3']
    },
    {
      name: 'Object in code block',
      response: '```json\n{"dataType": "clients", "conditions": []}\n```',
      expected: {"dataType": "clients", "conditions": []}
    }
  ]
  
  // Test the parsing logic
  function parseAIResponse(responseText) {
    try {
      // Try to extract JSON from code blocks first
      const jsonPattern = /```json\n?([\s\S]*?)\n?```/
      const jsonMatch = responseText.match(jsonPattern)
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch (e) {
          console.warn('Failed to parse JSON from code block:', e)
        }
      }
      
      // Try to extract array pattern
      const arrayPattern = /\[[\s\S]*?\]/
      const arrayMatch = responseText.match(arrayPattern)
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0])
        } catch (e) {
          console.warn('Failed to parse array:', e)
        }
      }
      
      // Try object pattern
      const objectPattern = /\{[\s\S]*?\}/
      const objectMatch = responseText.match(objectPattern)
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0])
        } catch (e) {
          console.warn('Failed to parse object:', e)
        }
      }
      
      // Fallback: try parsing entire response
      return JSON.parse(responseText)
    } catch (error) {
      console.error('All parsing attempts failed:', error)
      return null
    }
  }
  
  // Run tests
  testResponses.forEach((test, index) => {
    console.log(`${index + 1}. Testing: ${test.name}`)
    console.log(`   Input: ${test.response}`)
    
    try {
      const result = parseAIResponse(test.response)
      const success = JSON.stringify(result) === JSON.stringify(test.expected)
      
      console.log(`   Result: ${JSON.stringify(result)}`)
      console.log(`   Expected: ${JSON.stringify(test.expected)}`)
      console.log(`   Status: ${success ? '✅ PASS' : '❌ FAIL'}\n`)
    } catch (error) {
      console.log(`   Status: ❌ ERROR - ${error.message}\n`)
    }
  })
  
  console.log('🎉 JSON parsing test completed!')
  console.log('\n🔧 The fix should now handle:')
  console.log('• AI responses wrapped in ```json code blocks')
  console.log('• Responses with or without newlines')
  console.log('• Both array and object JSON structures')
  console.log('• Graceful fallback for edge cases')
}

testJsonParsing()
