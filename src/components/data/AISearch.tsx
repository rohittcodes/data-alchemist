'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Sparkles, 
  Loader2, 
  Brain, 
  Filter,
  Lightbulb,
  ArrowRight,
  X
} from 'lucide-react'

interface AISearchProps {
  sessionId: string
  onResults?: (results: any) => void
  className?: string
}

interface SearchResult {
  filteredData: any
  filter: any
  explanation: string
  suggestedQueries?: string[]
  totalResults: number
}

export const AISearch: React.FC<AISearchProps> = ({
  sessionId,
  onResults,
  className
}) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [lastResult, setLastResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load suggestions on component mount
  useEffect(() => {
    loadSuggestions()
  }, [sessionId])

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true)
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'suggestions'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query
    if (!queryToUse.trim()) return

    try {
      setIsSearching(true)
      setError(null)
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'search',
          query: queryToUse
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('AI Search Results:', data)
        console.log('Filtered Data:', data.filteredData)
        setLastResult(data)
        onResults?.(data)
        
        // Update suggestions if search returned empty results
        if (data.suggestedQueries?.length > 0) {
          setSuggestions(data.suggestedQueries)
        }
      } else {
        setError(data.error || 'Search failed')
        
        // Show suggested queries on error
        if (data.suggestedQueries?.length > 0) {
          setSuggestions(data.suggestedQueries)
        }
      }
    } catch (err) {
      setError('Failed to perform search')
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const clearResults = () => {
    setLastResult(null)
    setError(null)
    onResults?.(null)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>AI-Powered Search</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Google AI
            </Badge>
          </div>
          <CardDescription>
            Ask questions about your data in natural language
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., 'Show high priority clients' or 'Workers with JavaScript skills'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Results Summary */}
          {lastResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Search Results</span>
                    <Badge variant="outline">
                      {lastResult.totalResults} found
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    {lastResult.explanation}
                  </p>
                  {lastResult.totalResults === 0 && (
                    <p className="text-xs text-blue-600">
                      💡 Try one of the suggested queries below or refine your search
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResults}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Try these searches:</span>
              {loadingSuggestions && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-2 text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="text-xs truncate">{suggestion}</span>
                  <ArrowRight className="h-3 w-3 ml-auto flex-shrink-0" />
                </Button>
              ))}
            </div>
            
            {suggestions.length === 0 && !loadingSuggestions && (
              <p className="text-xs text-muted-foreground">
                Upload data to see AI-powered search suggestions
              </p>
            )}
          </div>

          {/* Filter Preview (for advanced users) */}
          {lastResult?.filter && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View generated filter (advanced)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(lastResult.filter, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
