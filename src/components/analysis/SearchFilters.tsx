import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"

interface SearchFiltersProps {
  searchQuery: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function SearchFilters({ 
  searchQuery, 
  statusFilter, 
  onSearchChange, 
  onStatusChange 
}: SearchFiltersProps) {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sessions by ID or filename..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
