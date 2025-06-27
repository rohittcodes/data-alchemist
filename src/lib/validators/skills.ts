import { ValidationError, DataRow } from './types'

/**
 * Parses skills from a string (comma or semicolon separated)
 */
function parseSkills(skillsStr: string): string[] {
  if (!skillsStr || typeof skillsStr !== 'string') return []
  
  return skillsStr
    .split(/[,;]/)
    .map(skill => skill.trim().toLowerCase())
    .filter(skill => skill.length > 0)
}

/**
 * Validates skill coverage between tasks and workers
 */
export function validateSkillCoverage(
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!workers || !tasks) {
    return errors
  }
  
  // Collect all available skills from workers
  const availableSkills = new Set<string>()
  workers.forEach(worker => {
    const skills = parseSkills(String(worker.skills || ''))
    skills.forEach(skill => availableSkills.add(skill))
  })
  
  // Check if each task's required skills are covered
  tasks.forEach((task, index) => {
    const requiredSkills = parseSkills(String(task.skills || ''))
    const uncoveredSkills: string[] = []
    
    requiredSkills.forEach(skill => {
      if (!availableSkills.has(skill)) {
        uncoveredSkills.push(skill)
      }
    })
    
    if (uncoveredSkills.length > 0) {
      errors.push({
        type: 'warning',
        category: 'skill',
        severity: 'medium',
        dataType: 'tasks',
        row: index,
        column: 'skills',
        message: `Task requires skills not available in worker pool: ${uncoveredSkills.join(', ')}`,
        value: task.skills,
        suggestion: `Consider hiring workers with these skills or modifying task requirements`
      })
    }
  })
  
  return errors
}

/**
 * Validates individual worker skill utilization
 */
export function validateWorkerUtilization(
  workers?: DataRow[],
  tasks?: DataRow[]
): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!workers || !tasks) {
    return errors
  }
  
  // Collect required skills from all tasks
  const requiredSkills = new Set<string>()
  tasks.forEach(task => {
    const skills = parseSkills(String(task.skills || ''))
    skills.forEach(skill => requiredSkills.add(skill))
  })
  
  // Check if workers have skills that aren't needed
  workers.forEach((worker, index) => {
    const workerSkills = parseSkills(String(worker.skills || ''))
    const unusedSkills = workerSkills.filter(skill => !requiredSkills.has(skill))
    
    if (unusedSkills.length > 0 && workerSkills.length > 0) {
      errors.push({
        type: 'warning',
        category: 'skill',
        severity: 'low',
        dataType: 'workers',
        row: index,
        column: 'skills',
        message: `Worker has skills not required by any task: ${unusedSkills.join(', ')}`,
        value: worker.skills,
        suggestion: `Consider assigning additional tasks or training in high-demand skills`
      })
    }
  })
  
  return errors
}
