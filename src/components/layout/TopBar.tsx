import React from 'react'
import { UserButton } from '@clerk/nextjs'
import { SearchBar } from '@/components/layout/SearchBar'
import { GitHubStats } from '@/components/ui/GitHubStats'
import { GITHUB_CONFIG } from '@/lib/github-config'

export function TopBar() {
  return (
    <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <SearchBar />
      </div>
      
      <div className="flex items-center space-x-4">
        <GitHubStats repoUrl={GITHUB_CONFIG.repoUrl} />
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </div>
    </header>
  )
}
