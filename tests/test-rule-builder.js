// Test script for Smart Rule Builder functionality
const testRuleBuilder = async () => {
  console.log('🧪 Testing Smart Rule Builder...')
  
  const testSessionId = 'test-session-' + Date.now()
  
  // Sample rule data
  const testRules = [
    {
      type: 'coRun',
      tasks: ['task1', 'task2'],
      description: 'Task 1 and Task 2 must run together'
    },
    {
      type: 'loadLimit',
      workers: ['worker1'],
      maxLoad: 5,
      description: 'Worker 1 maximum load: 5 tasks'
    },
    {
      type: 'phaseWindow',
      phase: 'Phase 1',
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      description: 'Phase 1 runs from January to March 2025'
    }
  ]
  
  try {
    console.log('1. Testing rule creation...')
    
    for (const ruleData of testRules) {
      const response = await fetch(`http://localhost:3000/api/session/${testSessionId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule: {
            id: `rule_${Date.now()}_${Math.random()}`,
            created: Date.now(),
            status: 'active',
            ...ruleData
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Created ${ruleData.type} rule:`, result)
      } else {
        console.log(`❌ Failed to create ${ruleData.type} rule:`, response.status)
      }
    }
    
    console.log('2. Testing rule retrieval...')
    const getResponse = await fetch(`http://localhost:3000/api/session/${testSessionId}/rules`)
    
    if (getResponse.ok) {
      const { rules } = await getResponse.json()
      console.log(`✅ Retrieved ${rules.length} rules:`, rules.map(r => r.type))
    } else {
      console.log('❌ Failed to retrieve rules:', getResponse.status)
    }
    
    console.log('3. Testing AI rule creation...')
    const aiRuleTests = [
      'Tasks Setup and Testing must run together',
      'John can work on maximum 3 tasks',
      'Phase Alpha runs from February to April'
    ]
    
    for (const text of aiRuleTests) {
      const aiResponse = await fetch('http://localhost:3000/api/ai/create-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sessionId: testSessionId,
          availableTasks: [
            { id: 'task1', title: 'Setup' },
            { id: 'task2', title: 'Testing' },
            { id: 'task3', title: 'Deployment' }
          ],
          availableWorkers: [
            { id: 'worker1', name: 'John' },
            { id: 'worker2', name: 'Jane' }
          ]
        })
      })
      
      if (aiResponse.ok) {
        const aiResult = await aiResponse.json()
        console.log(`✅ AI created rule from "${text}":`, aiResult.rule)
      } else {
        console.log(`❌ AI failed for "${text}":`, aiResponse.status)
      }
    }
    
    console.log('🎉 Rule Builder test completed!')
    
  } catch (error) {
    console.error('❌ Test Error:', error)
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRuleBuilder }
} else if (typeof window !== 'undefined') {
  window.testRuleBuilder = testRuleBuilder
}

console.log('Rule Builder Test loaded. Run testRuleBuilder() to test.')
