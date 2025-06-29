"use client"

import { useState, useEffect } from 'react'
import { getRepoInfo } from '@/lib/github-config'

interface GitHubStats {
  stars: number
  forks: number
  loading: boolean
  error: string | null
}

export function useGitHubStats(repoUrl: string): GitHubStats {
  const [stats, setStats] = useState<GitHubStats>({
    stars: 0,
    forks: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))
        
        // Extract owner and repo from URL using helper
        const { owner, repo, apiUrl } = getRepoInfo(repoUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            // Add authorization if you have a GitHub token for higher rate limits
            ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
              'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
            })
          }
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            // Repository not found - this is common for demo projects
            console.warn(`Repository not found: ${owner}/${repo}`)
            setStats({
              stars: 0,
              forks: 0,
              loading: false,
              error: 'Repository not found'
            })
            return
          }
          throw new Error(`GitHub API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        setStats({
          stars: data.stargazers_count || 0,
          forks: data.forks_count || 0,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching GitHub stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch GitHub stats'
        }))
      }
    }

    if (repoUrl) {
      fetchGitHubStats()
    }
  }, [repoUrl])

  return stats
}
