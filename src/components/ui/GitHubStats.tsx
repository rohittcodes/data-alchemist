"use client"

import React from 'react'
import { useGitHubStats } from '@/hooks/useGitHubStats'

interface GitHubStatsProps {
  repoUrl: string
  showForks?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function GitHubStats({ 
  repoUrl, 
  showForks = false, 
  className = "",
  size = 'md' 
}: GitHubStatsProps) {
  const { stars, forks, loading, error } = useGitHubStats(repoUrl)

  const sizeClasses = {
    sm: { icon: "w-3 h-3", text: "text-xs" },
    md: { icon: "w-4 h-4", text: "text-sm" },
    lg: { icon: "w-5 h-5", text: "text-base" }
  }

  const { icon: iconSize, text: textSize } = sizeClasses[size]

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-gray-400 ${className}`}>
        <div className={`${iconSize} animate-pulse bg-gray-400 rounded`}></div>
        <span className={`${textSize} font-medium`}>...</span>
      </div>
    )
  }

  if (error) {
    // Show a fallback with placeholder data for demo purposes
    return (
      <div className={`flex items-center gap-1 text-yellow-400 ${className}`}>
        <svg className={`${iconSize}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        <span className={`${textSize} font-medium`}>
          {size === 'sm' ? '⭐' : '⭐ Star us!'}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-yellow-400">
        <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        <span className={`${textSize} font-medium`}>
          {size === 'sm' ? stars : `${stars} star${stars !== 1 ? 's' : ''}`}
        </span>
      </div>
      
      {showForks && (
        <div className="flex items-center gap-1 text-blue-400">
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className={`${textSize} font-medium`}>
            {size === 'sm' ? forks : `${forks} fork${forks !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
    </div>
  )
}
