import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const targetUrl = `/analysis?search=${encodeURIComponent(searchQuery.trim())}`
      router.push(targetUrl)
      setSearchQuery("")
      setShowSearchResults(false)
    }
  }

  const searchSessions = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        const sessions = data.sessions || []
        
        const filtered = sessions.filter((session: any) => {
          const q = query.toLowerCase()
          return (
            session.sessionId?.toLowerCase().includes(q) ||
            session.files?.clients?.fileName?.toLowerCase().includes(q) ||
            session.files?.workers?.fileName?.toLowerCase().includes(q) ||
            session.files?.tasks?.fileName?.toLowerCase().includes(q)
          )
        }).slice(0, 5)
        
        setSearchResults(filtered)
        setShowSearchResults(filtered.length > 0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSessions(searchQuery)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
        />
      </form>

      {/* Search Results Dropdown */}
      {showSearchResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((session, index) => (
                <button
                  key={session.sessionId}
                  onClick={() => {
                    router.push(`/analysis/${session.sessionId}`)
                    setSearchQuery("")
                    setShowSearchResults(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="text-sm text-white font-medium">
                    Session {session.sessionId.slice(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(session.created).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-400 text-sm">
              No sessions found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
