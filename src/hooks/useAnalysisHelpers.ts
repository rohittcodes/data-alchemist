import { ValidationSummary } from "@/lib/validators/types"

export function useAnalysisHelpers() {
  const getHealthScore = (validation: ValidationSummary | null) => {
    if (!validation) return 0
    const { totalErrors, totalWarnings } = validation
    const totalIssues = totalErrors + totalWarnings
    return totalIssues === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10 + totalWarnings * 3))
  }

  const getManualAndBusinessErrors = (validation: ValidationSummary | null) => {
    if (!validation) return { manualReview: [], businessDecisions: [] }
    
    const manualReview = validation.allErrors.filter(error => 
      error.category !== 'business' && error.category !== 'skill'
    )
    
    const businessDecisions = validation.allErrors.filter(error => 
      error.category === 'business' || error.category === 'skill'
    )
    
    return { manualReview, businessDecisions }
  }

  return {
    getHealthScore,
    getManualAndBusinessErrors
  }
}
