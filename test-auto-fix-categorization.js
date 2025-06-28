// Test auto-fix categorization logic
const { canAutoFix, getFixRecommendations } = require('./src/lib/validators/auto-fix')

const testAutoFixCategorization = () => {
  console.log('🧪 Testing Auto-Fix Categorization...\n')
  
  // Sample validation errors for testing
  const testErrors = [
    {
      type: 'error',
      category: 'datatype',
      severity: 'medium',
      dataType: 'workers',
      row: 0,
      column: 'rate',
      message: 'Invalid rate format: "90.5USD"',
      value: '90.5USD',
      suggestion: 'Rate should be a number'
    },
    {
      type: 'error',
      category: 'required',
      severity: 'medium',
      dataType: 'clients',
      row: 1,
      column: 'priority',
      message: 'Priority field is required',
      value: null,
      suggestion: 'Set a priority level'
    },
    {
      type: 'error',
      category: 'business',
      severity: 'high',
      dataType: 'tasks',
      row: 2,
      column: 'skills',
      message: 'No workers with React skills for React project',
      value: 'React',
      suggestion: 'Hire React specialist or train existing team'
    },
    {
      type: 'error',
      category: 'skill',
      severity: 'high',
      dataType: 'workers',
      row: 3,
      column: 'assignment',
      message: 'Java developer assigned to Python project',
      value: 'Java -> Python',
      suggestion: 'Reassign or provide training'
    },
    {
      type: 'error',
      category: 'reference',
      severity: 'high',
      dataType: 'tasks',
      row: 4,
      column: 'clientId',
      message: 'Client ID "999" not found',
      value: '999',
      suggestion: 'Verify client ID or create new client'
    },
    {
      type: 'error',
      category: 'duplicate',
      severity: 'low',
      dataType: 'workers',
      row: 5,
      column: 'workerId',
      message: 'Duplicate worker ID: "W001"',
      value: 'W001',
      suggestion: 'Make ID unique'
    }
  ]
  
  // Test categorization
  console.log('📊 Auto-Fix Categorization Results:')
  console.log('==================================\n')
  
  testErrors.forEach((error, index) => {
    const autoFixable = canAutoFix(error)
    const category = error.category === 'business' || error.category === 'skill' 
      ? '🔴 Business Decision'
      : autoFixable 
        ? '🟢 Auto-Fixable'
        : '🟡 Manual Review'
    
    console.log(`${index + 1}. ${error.message}`)
    console.log(`   Category: ${error.category} | Severity: ${error.severity}`)
    console.log(`   Classification: ${category}`)
    console.log(`   Can Auto-Fix: ${autoFixable ? 'Yes' : 'No'}`)
    console.log()
  })
  
  // Test recommendation function
  const recommendations = getFixRecommendations(testErrors)
  
  console.log('📋 Fix Recommendations Summary:')
  console.log('==============================')
  console.log(`🟢 Auto-fixable: ${recommendations.autoFixable.length} issues`)
  console.log(`🟡 Manual review: ${recommendations.manualReview.length} issues`)
  console.log(`🔴 Business decisions: ${recommendations.businessDecisions.length} issues`)
  console.log()
  
  console.log('🟢 Auto-fixable issues:')
  recommendations.autoFixable.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error.message} (${error.category})`)
  })
  console.log()
  
  console.log('🟡 Manual review needed:')
  recommendations.manualReview.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error.message} (${error.category})`)
  })
  console.log()
  
  console.log('🔴 Business decisions required:')
  recommendations.businessDecisions.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error.message} (${error.category})`)
  })
  
  console.log('\n✨ Smart categorization ensures:')
  console.log('• Simple formatting issues get auto-fixed')
  console.log('• Complex business decisions stay with humans')
  console.log('• Data integrity is maintained')
  console.log('• User productivity is maximized')
}

// Only run if this is the main module
if (require.main === module) {
  testAutoFixCategorization()
}

module.exports = { testAutoFixCategorization }
